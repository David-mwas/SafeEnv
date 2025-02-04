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
	"github.com/joho/godotenv"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var (
	app        *gin.Engine
	client     *mongo.Client
	collection *mongo.Collection
)

func init() {
	// Load environment variables
	err := godotenv.Load()
	if err != nil {
		log.Println("Warning: No .env file found")
	}

	// Load secrets
	encryptionKey := []byte(os.Getenv("SAFEENV_SECRET_KEY"))

	if len(encryptionKey) != 32 {
		log.Fatal("Encryption key must be exactly 32 bytes long")
	}

	// Ensure SAFEENV_MONGO_URI exists
	mongoURI := os.Getenv("SAFEENV_MONGO_URI")
	if mongoURI == "" {
		log.Fatal("SAFEENV_MONGO_URI environment variable is not set")
	}

	// Connect to MongoDB once at startup
	var connErr error
	client, connErr = connectDB()
	if connErr != nil {
		log.Fatalf("Database connection failed: %v", connErr)
	}

	// Select the collection
	collection = client.Database("safeenv").Collection("variables")
	if collection == nil {
		log.Fatal("MongoDB collection is nil")
	}

	// Initialize Gin
	app = gin.Default()

	// Apply CORS Middleware
	app.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"https://safe-env.vercel.app"}, // Allow frontend requests
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// Register routes
	routes.Register(app)
}

func connectDB() (*mongo.Client, error) {
	clientOptions := options.Client().ApplyURI(os.Getenv("SAFEENV_MONGO_URI"))

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	client, err := mongo.Connect(ctx, clientOptions)
	if err != nil {
		return nil, err
	}

	return client, nil
}

// Vercel Lambda Handler
func Handler(w http.ResponseWriter, r *http.Request) {
	app.ServeHTTP(w, r)
}
