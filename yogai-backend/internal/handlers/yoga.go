package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/omerkisa/yogai-backend/internal/models"
	"github.com/omerkisa/yogai-backend/internal/repository"
	"github.com/omerkisa/yogai-backend/internal/services"
)

type YogaHandler struct {
	aiService services.AIService
	repo      repository.YogaRepository
}

func NewYogaHandler(aiService services.AIService, repo repository.YogaRepository) *YogaHandler {
	return &YogaHandler{
		aiService: aiService,
		repo:      repo,
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
	uid, exists := c.Get("user_id")
	if !exists {
		models.ErrorResponse(c, http.StatusUnauthorized, "user not authenticated")
		return
	}

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

	plan := &repository.YogaPlan{
		Plan:      result,
		Level:     req.Level,
		Duration:  req.Duration,
		FocusArea: req.FocusArea,
	}

	if err := h.repo.SavePlan(c.Request.Context(), uid.(string), plan); err != nil {
		models.ErrorResponse(c, http.StatusInternalServerError, "failed to save yoga plan")
		return
	}

	var parsedPlan interface{}
	if err := json.Unmarshal([]byte(result), &parsedPlan); err != nil {
		parsedPlan = result
	}

	models.CreatedResponse(c, "yoga plan generated and saved", gin.H{
		"plan_id": plan.ID,
		"plan":    parsedPlan,
	})
}

func (h *YogaHandler) AnalyzePose(c *gin.Context) {
	_, exists := c.Get("user_id")
	if !exists {
		models.ErrorResponse(c, http.StatusUnauthorized, "user not authenticated")
		return
	}

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

	var parsedAnalysis interface{}
	if err := json.Unmarshal([]byte(result), &parsedAnalysis); err != nil {
		parsedAnalysis = result
	}

	models.SuccessResponse(c, "pose analyzed successfully", gin.H{
		"analysis": parsedAnalysis,
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

	prompt += ". Return a JSON object with fields: title, description, total_duration, " +
		"and poses (array of objects with name, duration_seconds, description, difficulty)."
	return prompt
}

func buildAnalyzePrompt(req AnalyzePoseRequest) string {
	return "Analyze the following yoga pose and provide corrections and tips: " +
		"Pose: " + req.PoseName + ", " +
		"Description: " + req.Description +
		". Return a JSON object with fields: pose_name, alignment_tips (array), " +
		"common_mistakes (array), modifications (array), benefits (array)."
}
