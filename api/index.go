package handler

import (
	"context"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/David-mwas/SafeEnv/routes"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var collection *mongo.Collection

var app *gin.Engine

func init() {
	// Load environment variables
	// err := godotenv.Load()
	// if err != nil {
	// 	log.Println("Warning: No .env file found")
	// }

	// Load secrets
	// encryptionKey := []byte(os.Getenv("SAFEENV_SECRET_KEY"))

	// if len(encryptionKey) != 32 {
	// 	log.Fatal("Encryption key must be exactly 32 bytes long")
	// }

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

	routes.Register(app)
}

// Vercel Lambda Handler
func Handler(w http.ResponseWriter, r *http.Request) {
	app.ServeHTTP(w, r)
}
