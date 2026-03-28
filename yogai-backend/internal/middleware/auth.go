package middleware

import (
	"log"
	"net/http"
	"strings"

	"firebase.google.com/go/v4/auth"
	"github.com/gin-gonic/gin"
	"github.com/omerkisa/yogai-backend/internal/models"
)

func FirebaseAuth(authClient *auth.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
                        log.Printf("[AUTH ERROR] Missing Authorization header")
                        models.ErrorResponse(c, http.StatusUnauthorized, "authorization header is required")
                        c.Abort()
                        return
                }

                parts := strings.SplitN(authHeader, " ", 2)
                if len(parts) != 2 || parts[0] != "Bearer" {
                        log.Printf("[AUTH ERROR] Invalid authorization format: %s", authHeader)
			return
		}

		token, err := authClient.VerifyIDToken(c.Request.Context(), parts[1])
		if err != nil {
                        log.Printf("[AUTH ERROR] Token verification failed: %v", err)
			return
		}

		c.Set("user_id", token.UID)
		c.Next()
	}
}
