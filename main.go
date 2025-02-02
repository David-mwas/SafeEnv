// main.go (Backend API using Go + Gin + MongoDB)
package main

import (
	"context"
	"crypto/aes"
	"crypto/cipher"
	"encoding/base64"
	"fmt"
	"log"
	"net/http"

	// "os"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	// "github.com/golang-jwt/jwt/v5"
)

var collection *mongo.Collection
// var jwtSecret = []byte("supersecretkey")
var encryptionKey = []byte("12345678901234567890123456789012")

func main() {
	clientOptions := options.Client().ApplyURI("mongodb://localhost:27017")
	client, err := mongo.Connect(context.TODO(), clientOptions)
	if err != nil {
		log.Fatal(err)
	}
	collection = client.Database("safeenv").Collection("variables")

	r := gin.Default()
	r.GET("/", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "Welcome to SafeEnv API"})
	})
	r.POST("/api/v1/store", storeVariable)
	r.GET("/api/v1/retrieve/:key", retrieveVariable)
	r.POST("/api/v1/share", shareVariable)
	r.GET("/api/v1/audit", auditLogs)
	r.Run(":8080")
}

func encrypt(text string) (string, error) {
	block, err := aes.NewCipher(encryptionKey)
	if err != nil {
		return "", err
	}
	iv := encryptionKey[:aes.BlockSize]
	stream := cipher.NewCFBEncrypter(block, iv)
	ciphertext := make([]byte, len(text))
	stream.XORKeyStream(ciphertext, []byte(text))
	return base64.StdEncoding.EncodeToString(ciphertext), nil
}

func decrypt(text string) (string, error) {
	block, err := aes.NewCipher(encryptionKey)
	if err != nil {
		return "", err
	}
	iv := encryptionKey[:aes.BlockSize]
	ciphertext, _ := base64.StdEncoding.DecodeString(text)
	stream := cipher.NewCFBDecrypter(block, iv)
	plaintext := make([]byte, len(ciphertext))
	stream.XORKeyStream(plaintext, ciphertext)
	return string(plaintext), nil
}

func storeVariable(c *gin.Context) {
	var data struct {
		Key   string `json:"key"`
		Value string `json:"value"`
	}
	if err := c.ShouldBindJSON(&data); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	encryptedValue, err := encrypt(data.Value)
	fmt.Println("encryptedValue", encryptedValue)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Encryption failed " + err.Error()})
		fmt.Println(err)
		return
	}

	collection.InsertOne(context.TODO(), bson.M{"key": data.Key, "value": encryptedValue})
	c.JSON(http.StatusOK, gin.H{"message": "Stored successfully"})
}

func retrieveVariable(c *gin.Context) {
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

func shareVariable(c *gin.Context) {
	var data struct {
		Key string `json:"key"`
	}
	if err := c.ShouldBindJSON(&data); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	// Generate a temporary shareable link (dummy link for now)
	shareLink := "https://localost:8080/" + data.Key
	c.JSON(http.StatusOK, gin.H{"message": "Shareable link generated", "link": shareLink})
}

func auditLogs(c *gin.Context) {
	// Dummy audit log response for now
	logs := []string{"User1 stored KEY1", "User2 retrieved KEY2"}
	c.JSON(http.StatusOK, gin.H{"logs": logs})
}
