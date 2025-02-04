package handler

import (
	"context"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/David-mwas/SafeEnv/routes"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var collection *mongo.Collection
var encryptionKey []byte
var jwtSecret []byte
var (
	app *gin.Engine
)

func init() {
	err := godotenv.Load() // Load .env file for local testing
	if err != nil {
		log.Println("Warning: No .env file found")
	}

	encryptionKey = []byte(os.Getenv("SAFEENV_SECRET_KEY"))
	jwtSecret = []byte(os.Getenv("SAFEENV_JWT_SECRET"))

	if len(encryptionKey) != 32 {
		log.Fatal("Encryption key must be exactly 32 bytes long")
	}

	app = gin.New()
	routes.Register(app)
}

func connectDB() (*mongo.Client, context.Context, error) {
	clientOptions := options.Client().ApplyURI(os.Getenv("SAFEENV_MONGO_URI"))
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	client, err := mongo.Connect(ctx, clientOptions)
	if err != nil {
		return nil, nil, err
	}

	return client, ctx, nil
}

func Handler(w http.ResponseWriter, r *http.Request) {
	client, ctx, err := connectDB()
	if err != nil {
		http.Error(w, "Database connection failed", http.StatusInternalServerError)
		return
	}
	defer client.Disconnect(ctx)

	collection = client.Database("safeenv").Collection("variables")

	app.ServeHTTP(w, r)
}
