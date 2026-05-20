package middleware

import (
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
)

func CORS() gin.HandlerFunc {
	allowOrigin := os.Getenv("CORS_ALLOW_ORIGIN")
	if allowOrigin == "" {
		allowOrigin = "*"
	}

	return func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", allowOrigin)
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Authorization")
		c.Header("Access-Control-Allow-Credentials", "true")
		c.Header("Access-Control-Max-Age", "86400")

		if c.Request.Method == http.MethodOptions {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Next()
	}
}
