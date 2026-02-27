package handlers

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/omerkisa/yogai-backend/internal/models"
	"github.com/omerkisa/yogai-backend/internal/services"
)

type YogaHandler struct {
	aiService services.AIService
}

func NewYogaHandler(aiService services.AIService) *YogaHandler {
	return &YogaHandler{
		aiService: aiService,
	}
}

type GeneratePlanRequest struct {
	Level       string `json:"level" binding:"required"`
	Duration    int    `json:"duration" binding:"required"`
	FocusArea   string `json:"focus_area"`
	Preferences string `json:"preferences"`
}

type AnalyzePoseRequest struct {
	PoseName    string `json:"pose_name" binding:"required"`
	Description string `json:"description" binding:"required"`
}

func (h *YogaHandler) GeneratePlan(c *gin.Context) {
	var req GeneratePlanRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		models.ErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	prompt := buildPlanPrompt(req)

	result, err := h.aiService.GenerateYogaPlan(c.Request.Context(), prompt)
	if err != nil {
		models.ErrorResponse(c, http.StatusInternalServerError, "failed to generate yoga plan")
		return
	}

	models.SuccessResponse(c, "yoga plan generated successfully", gin.H{
		"plan": result,
	})
}

func (h *YogaHandler) AnalyzePose(c *gin.Context) {
	var req AnalyzePoseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		models.ErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	prompt := buildAnalyzePrompt(req)

	result, err := h.aiService.AnalyzePose(c.Request.Context(), prompt)
	if err != nil {
		models.ErrorResponse(c, http.StatusInternalServerError, "failed to analyze pose")
		return
	}

	models.SuccessResponse(c, "pose analyzed successfully", gin.H{
		"analysis": result,
	})
}

func (h *YogaHandler) HealthCheck(c *gin.Context) {
	models.SuccessResponse(c, "YogAI API is running", nil)
}

func buildPlanPrompt(req GeneratePlanRequest) string {
	prompt := "Create a personalized yoga plan with the following criteria: " +
		"Level: " + req.Level + ", " +
		"Duration: " + fmt.Sprintf("%d", req.Duration) + " minutes"

	if req.FocusArea != "" {
		prompt += ", Focus Area: " + req.FocusArea
	}
	if req.Preferences != "" {
		prompt += ", Preferences: " + req.Preferences
	}

	prompt += ". Return poses with name, duration, description and difficulty."
	return prompt
}

func buildAnalyzePrompt(req AnalyzePoseRequest) string {
	return "Analyze the following yoga pose and provide corrections and tips: " +
		"Pose: " + req.PoseName + ", " +
		"Description: " + req.Description +
		". Return alignment tips, common mistakes, and modifications."
}
