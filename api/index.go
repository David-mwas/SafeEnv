package handler

import (
	"context"
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"net/http"
	"net/smtp"
	"time"

	"os"

	"log"

	"github.com/golang-jwt/jwt/v5"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"golang.org/x/crypto/bcrypt"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var collection *mongo.Collection
var encryptionKey []byte
var jwtSecret []byte

var app *gin.Engine

func init() {
	// Load environment variables
	// err := godotenv.Load()
	// if err != nil {
	// 	log.Println("Warning: No .env file found")
	// }

	// Load secrets
	encryptionKey = []byte(os.Getenv("SAFEENV_SECRET_KEY"))
	jwtSecret = []byte(os.Getenv("SAFEENV_JWT_SECRET"))

	if len(encryptionKey) != 32 {
		log.Fatal("Encryption key must be exactly 32 bytes long")
	}

	// Ensure SAFEENV_MONGO_URI exists
	mongoURI := os.Getenv("SAFEENV_MONGO_URI")
	if mongoURI == "" {
		log.Fatal("SAFEENV_MONGO_URI environment variable is not set")
		return
	}

	// Connect to MongoDB
	clientOptions := options.Client().ApplyURI(mongoURI)
	client, err := mongo.Connect(context.Background(), clientOptions) // Assign to global `client`
	if err != nil {
		log.Fatalf("Failed to connect to MongoDB: %v", err)
	}

	collection = client.Database("safeenv").Collection("variables") // Assign to global `collection`
	if collection == nil {
		log.Fatal("MongoDB collection is nil")
	}
	app = gin.New()
	// Initialize Gin
	// app = gin.Default()

	// Apply CORS Middleware
	app.Use(cors.New(cors.Config{
		AllowOrigins:     []string{os.Getenv("SAFEENV_FRONTEND_URL")}, // Allow frontend requests
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// Register routes

	Register(app)
}

// Vercel Lambda Handler
func Handler(w http.ResponseWriter, r *http.Request) {
	app.ServeHTTP(w, r)
}

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

	keyID := c.Param("id") // Fetch _id from URL parameters
	fmt.Println(keyID)

	// Convert keyID to ObjectID
	objID, err := primitive.ObjectIDFromHex(keyID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid key ID format"})
		return
	}

	// Delete the key by _id
	result, err := collection.DeleteOne(context.TODO(), bson.M{"_id": objID, "userID": userID})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete key"})
		return
	}

	// Check if any document was deleted
	if result.DeletedCount == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Key not found"})
		return
	}

	// Remove key from user's keys list
	_, err = collection.Database().Collection("users").UpdateOne(
		context.TODO(),
		bson.M{"_id": userID},
		bson.M{"$pull": bson.M{"keys": objID}}, // Assuming keys array stores ObjectIDs
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
		c.JSON(http.StatusInternalServerError, gin.H{"error": err})
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

func storeVariablesBulk(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var request struct {
		Variables map[string]string `json:"variables"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var documents []interface{}

	for key, value := range request.Variables {
		encryptedValue, err := encrypt(value)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Encryption failed",
				"text": err,
			})
			return
		}

		documents = append(documents, bson.M{
			"userID":    userID,
			"key":       key,
			"value":     encryptedValue,
			"createdAt": time.Now(),
		})
	}

	_, err := collection.InsertMany(context.TODO(), documents)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Variables stored successfully"})
}

// send-reset-email
func sendResetEmail(to, resetToken string) error {
	smtpHost := os.Getenv("SMTP_HOST")
	smtpPort := os.Getenv("SMTP_PORT")
	smtpEmail := os.Getenv("SMTP_EMAIL")
	smtpPassword := os.Getenv("SMTP_PASSWORD")
	frontendURL := os.Getenv("SAFEENV_FRONTEND_URL")

	// Debugging logs
	// fmt.Println("SMTP Configs:", smtpHost, smtpPort, smtpEmail)

	if smtpHost == "" || smtpPort == "" || smtpEmail == "" || smtpPassword == "" || frontendURL == "" {
		return fmt.Errorf("SMTP credentials are not set properly")
	}

	addr := fmt.Sprintf("%s:%s", smtpHost, smtpPort)
	auth := smtp.PlainAuth("", smtpEmail, smtpPassword, smtpHost)

	// Generate the reset link with the token
	resetLink := fmt.Sprintf("%s/reset-password?token=%s", frontendURL, resetToken)

	subject := "Password Reset Request"
	body := fmt.Sprintf(
		"Hello,\n\nClick the link below to reset your password:\n%s\n\nIf you didn't request this, please ignore it.The link will expire in 1 hour.\n\nThanks,\nSafeEnv",
		resetLink,
	)

	msg := []byte("Subject: " + subject + "\r\n\r\n" + body)

	err := smtp.SendMail(addr, auth, smtpEmail, []string{to}, msg)
	if err != nil {
		return fmt.Errorf("failed to send email: %v", err)
	}
	return nil
}

func requestPasswordReset(c *gin.Context) {
	var request struct {
		Email string `json:"email"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	// Check if user exists
	var user struct {
		ID    primitive.ObjectID `bson:"_id"`
		Email string             `bson:"email"`
	}
	err := collection.Database().Collection("users").FindOne(context.TODO(), bson.M{"email": request.Email}).Decode(&user)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// Generate reset token (JWT)
	resetToken := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"email": user.Email,
		"exp":   time.Now().Add(time.Hour * 1).Unix(), // Expires in 1 hour
	})
	tokenString, err := resetToken.SignedString(jwtSecret)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	// Store token in DB (optional)
	_, err = collection.Database().Collection("password_resets").InsertOne(context.TODO(), bson.M{
		"email":     user.Email,
		"token":     tokenString,
		"createdAt": time.Now(),
		"expiresAt": time.Now().Add(time.Hour),
		"used":      false,
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to store reset token"})
		return
	}

	// Send Reset Email
	err = sendResetEmail(user.Email, tokenString)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to send email" + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Password reset email sent!"})
}

func resetPassword(c *gin.Context) {
	var request struct {
		Token       string `json:"token"`
		NewPassword string `json:"newPassword"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	// Parse the token
	token, err := jwt.Parse(request.Token, func(token *jwt.Token) (interface{}, error) {
		return jwtSecret, nil
	})

	if err != nil || !token.Valid {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token"})
		return
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token claims"})
		return
	}

	email, ok := claims["email"].(string)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email in token"})
		return
	}

	// Hash the new password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(request.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	// Update the user's password
	_, err = collection.Database().Collection("users").UpdateOne(
		context.TODO(),
		bson.M{"email": email},
		bson.M{"$set": bson.M{"passwordHash": string(hashedPassword)}},
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update password"})
		return
	}

	// Invalidate the reset token
	collection.Database().Collection("password_resets").DeleteOne(context.TODO(), bson.M{"email": email})

	c.JSON(http.StatusOK, gin.H{"message": "Password updated successfully!"})
}

func Register(app *gin.Engine) {

	app.Use(cors.New(cors.Config{
		AllowOrigins:     []string{os.Getenv("SAFEENV_FRONTEND_URL")}, // Hardcode for testing
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: true,
	}))

	// Public Routes
	app.GET("/", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "Welcome to SafeEnv API"})
	})
	app.POST("/api/v1/register", RegisterUser)
	app.POST("/api/v1/login", LoginUser)

	// Password reset routes
	app.POST("/api/v1/forgot-password", requestPasswordReset)
	app.POST("/api/v1/reset-password", resetPassword)

	// Protected Routes
	auth := app.Group("/api/v1")
	auth.Use(AuthMiddleware())

	{
		auth.POST("/store", StoreVariable)
		auth.GET("/keys", GetUserKeys)
		auth.GET("/user", GetCurrentUser)
		auth.DELETE("/keys/:key", DeleteKey)
		auth.PUT("/keys/:key", UpdateKey)
		auth.GET("/retrieve/:key", RetrieveVariable)
		auth.GET("/share/retrieve/:key", RetrieveSharedVariable)
		auth.POST("/share", ShareVariable)
		auth.POST("/store/bulk", storeVariablesBulk)
	}
}

func Errapp(c *gin.Context) {
	c.JSON(http.StatusBadRequest, gin.H{
		"errors": "this page could not be found",
	})
}
