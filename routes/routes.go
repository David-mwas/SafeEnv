// package routes

// import (
// 	"net/http"
// 	"os"

// 	"github.com/David-mwas/SafeEnv/handler"
// 	"github.com/gin-contrib/cors"
// 	"github.com/gin-gonic/gin"
// )

// func Register(app *gin.Engine) {

// 	app.Use(cors.New(cors.Config{
// 		AllowOrigins:     []string{os.Getenv("SAFEENV_FRONTEND_URL")}, // Hardcode for testing
// 		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
// 		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
// 		AllowCredentials: true,
// 	}))

// 	// Public Routes
// 	app.GET("/", func(c *gin.Context) {
// 		c.JSON(http.StatusOK, gin.H{"message": "Welcome to SafeEnv API"})
// 	})
// 	app.POST("/api/v1/register", handler.RegisterUser)
// 	app.POST("/api/v1/login", handler.LoginUser)

// 	// Protected Routes
// 	auth := app.Group("/api/v1")
// 	auth.Use(handler.AuthMiddleware())

// 	{
// 		auth.POST("/store", handler.StoreVariable)
// 		auth.GET("/keys", handler.GetUserKeys)
// 		auth.GET("/user", handler.GetCurrentUser)
// 		auth.DELETE("/keys/:key", handler.DeleteKey)
// 		auth.PUT("/keys/:key", handler.UpdateKey)
// 		auth.GET("/retrieve/:key", handler.RetrieveVariable)
// 		auth.GET("/share/retrieve/:key", handler.RetrieveSharedVariable)
// 		auth.POST("/share", handler.ShareVariable)
// 	}
// }

// func Errapp(c *gin.Context) {
// 	c.JSON(http.StatusBadRequest, gin.H{
// 		"errors": "this page could not be found",
// 	})
// }
