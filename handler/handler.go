package handler

import (
	"context"
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"net/http"
	"time"

	"os"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"golang.org/x/crypto/bcrypt"
)

var collection *mongo.Collection

var encryptionKey []byte
var jwtSecret []byte

func generateIV() ([]byte, error) {
	iv := make([]byte, aes.BlockSize)
	if _, err := rand.Read(iv); err != nil {
		return nil, err
	}
	return iv, nil
}

func encrypt(text string) (string, error) {
	block, err := aes.NewCipher(encryptionKey)
	if err != nil {
		return "", err
	}
	iv, err := generateIV()
	if err != nil {
		return "", err
	}
	stream := cipher.NewCFBEncrypter(block, iv)
	ciphertext := make([]byte, len(text))
	stream.XORKeyStream(ciphertext, []byte(text))

	// Store IV + Ciphertext together
	return base64.StdEncoding.EncodeToString(append(iv, ciphertext...)), nil
}

func decrypt(encryptedText string) (string, error) {
	block, err := aes.NewCipher(encryptionKey)
	if err != nil {
		return "", err
	}

	encryptedBytes, err := base64.StdEncoding.DecodeString(encryptedText)
	if err != nil {
		return "", err
	}

	if len(encryptedBytes) < aes.BlockSize {
		return "", fmt.Errorf("ciphertext too short")
	}

	iv := encryptedBytes[:aes.BlockSize]         // Extract IV
	ciphertext := encryptedBytes[aes.BlockSize:] // Extract actual data

	stream := cipher.NewCFBDecrypter(block, iv)
	plaintext := make([]byte, len(ciphertext))
	stream.XORKeyStream(plaintext, ciphertext)

	return string(plaintext), nil
}

// auth
func RegisterUser(c *gin.Context) {

	if collection == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database not initialized"})
		return
	}
	var user struct {
		Username string `json:"username"`
		Email    string `json:"email"`
		Password string `json:"password"`
	}

	if err := c.ShouldBindJSON(&user); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	// Store user in DB
	_, err = collection.Database().Collection("users").InsertOne(context.TODO(), bson.M{
		"username":     user.Username,
		"email":        user.Email,
		"passwordHash": string(hashedPassword),
		"createdAt":    time.Now(),
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to register"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User registered successfully"})
}

func LoginUser(c *gin.Context) {
	var credentials struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}

	if err := c.ShouldBindJSON(&credentials); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Fetch user from DB
	var user struct {
		ID           string `bson:"_id"`
		Username     string `bson:"username"`
		Email        string `bson:"email"`
		PasswordHash string `bson:"passwordHash"`
	}
	err := collection.Database().Collection("users").FindOne(context.TODO(), bson.M{"email": credentials.Email}).Decode(&user)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	// Compare password
	err = bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(credentials.Password))
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	// Generate JWT Token
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub": user.ID,
		"exp": time.Now().Add(time.Hour * 24).Unix(), // 1-day expiration
	})
	tokenString, err := token.SignedString(jwtSecret)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"token": tokenString})
}
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		tokenString := c.GetHeader("Authorization")
		if tokenString == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Token required"})
			c.Abort()
			return
		}

		// Remove "Bearer " prefix if present
		if len(tokenString) > 7 && tokenString[:7] == "Bearer " {
			tokenString = tokenString[7:]
		} else {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Malformed token"})
			c.Abort()
			return
		}

		// Parse JWT token
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			return jwtSecret, nil
		})

		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			c.Abort()
			return
		}

		// Extract user ID from token claims
		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token claims"})
			c.Abort()
			return
		}

		userID, ok := claims["sub"].(string)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid user ID in token"})
			c.Abort()
			return
		}

		// Store userID in the request context
		c.Set("userID", userID)

		c.Next()
	}
}

// Get Current User Details
func GetCurrentUser(c *gin.Context) {
	userID, exists := c.Get("userID")

	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	// Convert userID from string to ObjectID
	objectID, err := primitive.ObjectIDFromHex(userID.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}
	fmt.Println(userID, objectID)
	var user struct {
		ID       primitive.ObjectID `bson:"_id"`
		Username string             `bson:"username"`
		Email    string             `bson:"email"`
	}

	err = collection.Database().Collection("users").FindOne(context.TODO(), bson.M{"_id": objectID}).Decode(&user)
	if err != nil {
		fmt.Println("error", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "User not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"id":       user.ID,
		"username": user.Username,
		"email":    user.Email,
	})
}

// Delete a Key
func DeleteKey(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	key := c.Param("key")

	// Delete the key from the database
	_, err := collection.DeleteOne(context.TODO(), bson.M{"key": key, "userID": userID})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete key"})
		return
	}

	// Remove key from user's keys list
	_, err = collection.Database().Collection("users").UpdateOne(
		context.TODO(),
		bson.M{"_id": userID},
		bson.M{"$pull": bson.M{"keys": key}},
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user data"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Key deleted successfully"})
}

// Update a Key’s Value
func UpdateKey(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	key := c.Param("key")

	var data struct {
		NewValue string `json:"newValue"`
		NewKey   string `json:"newKey"`
	}

	if err := c.ShouldBindJSON(&data); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	encryptedValue, err := encrypt(data.NewValue)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Encryption failed"})
		return
	}

	// Update the stored key value
	_, err = collection.UpdateOne(
		context.TODO(),
		bson.M{"key": key, "userID": userID},
		bson.M{"$set": bson.M{"key": data.NewKey, "value": encryptedValue}},
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update key"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Key updated successfully"})
}

func GetUserKeys(c *gin.Context) {
	// Extract user ID from context
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	// Fetch all variables created by the user
	cursor, err := collection.Find(context.TODO(), bson.M{"userID": userID})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch keys"})
		return
	}
	defer cursor.Close(context.TODO())

	var keys []bson.M
	if err := cursor.All(context.TODO(), &keys); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode keys"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"keys": keys})
}

func StoreVariable(c *gin.Context) {
	// Extract user ID from the JWT
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var data struct {
		Key   string `json:"key"`
		Value string `json:"value"`
	}

	if err := c.ShouldBindJSON(&data); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	encryptedValue, err := encrypt(data.Value)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Encryption failed"})
		return
	}

	// Store the variable in the database
	_, err = collection.InsertOne(context.TODO(), bson.M{
		"key":       data.Key,
		"value":     encryptedValue,
		"userID":    userID,
		"createdAt": time.Now(),
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to store variable"})
		return
	}

	// Update the user's document to include this key
	_, err = collection.Database().Collection("users").UpdateOne(
		context.TODO(),
		bson.M{"_id": userID},
		bson.M{"$addToSet": bson.M{"keys": data.Key}}, // Add key to the user's list
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user data"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Stored successfully"})
}

func RetrieveSharedVariable(c *gin.Context) {
	encodedKey := c.Param("key")

	// Decode the Base64 key
	keyBytes, err := base64.URLEncoding.DecodeString(encodedKey)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid key"})
		return
	}
	key := string(keyBytes)

	// Search for the variable in MongoDB
	var result struct {
		Value string `bson:"value"`
	}
	err = collection.FindOne(context.TODO(), bson.M{"key": key}).Decode(&result)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Key not found"})
		return
	}

	// Decrypt the stored value
	decryptedValue, _ := decrypt(result.Value)

	c.JSON(http.StatusOK, gin.H{
		"key":   key,
		"value": decryptedValue,
	})
}

func RetrieveVariable(c *gin.Context) {
	key := c.Param("key")
	var result struct {
		Value string `bson:"value"`
	}
	if err := collection.FindOne(context.TODO(), bson.M{"key": key}).Decode(&result); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Not found"})
		return
	}
	decryptedValue, _ := decrypt(result.Value)
	c.JSON(http.StatusOK, gin.H{"key": key, "value": decryptedValue})
}

func ShareVariable(c *gin.Context) {
	var data struct {
		Key string `json:"key"`
	}
	if err := c.ShouldBindJSON(&data); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Retrieve the stored variable from MongoDB
	var result struct {
		Value string `bson:"value"`
	}
	err := collection.FindOne(context.TODO(), bson.M{"key": data.Key}).Decode(&result)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Key not found"})
		return
	}

	// Base64 encode the key (URL-safe)
	encodedKey := base64.URLEncoding.EncodeToString([]byte(data.Key))

	// Generate a shareable link
	shareLink := fmt.Sprintf(os.Getenv("SAFEENV_FRONTEND_URL")+"/share/retrieve/%s", encodedKey)

	c.JSON(http.StatusOK, gin.H{
		"message": "Shareable link generated",
		"link":    shareLink,
	})
}
