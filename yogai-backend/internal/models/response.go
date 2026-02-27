package models

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type APIResponse struct {
	Status  int         `json:"status"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}

func SuccessResponse(c *gin.Context, message string, data interface{}) {
	c.JSON(http.StatusOK, APIResponse{
		Status:  http.StatusOK,
		Message: message,
		Data:    data,
	})
}

func CreatedResponse(c *gin.Context, message string, data interface{}) {
	c.JSON(http.StatusCreated, APIResponse{
		Status:  http.StatusCreated,
		Message: message,
		Data:    data,
	})
}

func ErrorResponse(c *gin.Context, statusCode int, message string) {
	c.JSON(statusCode, APIResponse{
		Status:  statusCode,
		Message: message,
	})
}
