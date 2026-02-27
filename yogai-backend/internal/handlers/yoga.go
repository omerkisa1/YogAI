package handlers

import (
	"encoding/json"
	"fmt"
	"log"
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

func (h *YogaHandler) getUserID(c *gin.Context) (string, bool) {
	uid, exists := c.Get("user_id")
	if !exists {
		models.ErrorResponse(c, http.StatusUnauthorized, "user not authenticated")
		return "", false
	}
	return uid.(string), true
}

func (h *YogaHandler) GeneratePlan(c *gin.Context) {
	uid, ok := h.getUserID(c)
	if !ok {
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
		log.Printf("[ERROR] gemini GenerateYogaPlan failed: %v", err)
		models.ErrorResponse(c, http.StatusInternalServerError, "failed to generate yoga plan")
		return
	}

	plan := &repository.YogaPlan{
		Plan:      result,
		Level:     req.Level,
		Duration:  req.Duration,
		FocusArea: req.FocusArea,
	}

	if err := h.repo.SavePlan(c.Request.Context(), uid, plan); err != nil {
		log.Printf("[ERROR] firestore SavePlan failed for uid=%s: %v", uid, err)
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

func (h *YogaHandler) GetPlans(c *gin.Context) {
	uid, ok := h.getUserID(c)
	if !ok {
		return
	}

	plans, err := h.repo.GetPlans(c.Request.Context(), uid)
	if err != nil {
		log.Printf("[ERROR] firestore GetPlans failed for uid=%s: %v", uid, err)
		models.ErrorResponse(c, http.StatusInternalServerError, "failed to retrieve plans")
		return
	}

	var parsedPlans []gin.H
	for _, p := range plans {
		var parsedPlan interface{}
		if err := json.Unmarshal([]byte(p.Plan), &parsedPlan); err != nil {
			parsedPlan = p.Plan
		}
		parsedPlans = append(parsedPlans, gin.H{
			"id":         p.ID,
			"plan":       parsedPlan,
			"level":      p.Level,
			"duration":   p.Duration,
			"focus_area": p.FocusArea,
			"created_at": p.CreatedAt,
		})
	}

	models.SuccessResponse(c, "plans retrieved successfully", gin.H{
		"plans": parsedPlans,
		"count": len(parsedPlans),
	})
}

func (h *YogaHandler) GetPlanByID(c *gin.Context) {
	uid, ok := h.getUserID(c)
	if !ok {
		return
	}

	planID := c.Param("id")
	if planID == "" {
		models.ErrorResponse(c, http.StatusBadRequest, "plan id is required")
		return
	}

	plan, err := h.repo.GetPlanByID(c.Request.Context(), uid, planID)
	if err != nil {
		log.Printf("[ERROR] firestore GetPlanByID failed for uid=%s planID=%s: %v", uid, planID, err)
		models.ErrorResponse(c, http.StatusInternalServerError, "failed to retrieve plan")
		return
	}

	if plan == nil {
		models.ErrorResponse(c, http.StatusNotFound, "plan not found")
		return
	}

	var parsedPlan interface{}
	if err := json.Unmarshal([]byte(plan.Plan), &parsedPlan); err != nil {
		parsedPlan = plan.Plan
	}

	models.SuccessResponse(c, "plan retrieved successfully", gin.H{
		"id":         plan.ID,
		"plan":       parsedPlan,
		"level":      plan.Level,
		"duration":   plan.Duration,
		"focus_area": plan.FocusArea,
		"created_at": plan.CreatedAt,
	})
}

func (h *YogaHandler) DeletePlan(c *gin.Context) {
	uid, ok := h.getUserID(c)
	if !ok {
		return
	}

	planID := c.Param("id")
	if planID == "" {
		models.ErrorResponse(c, http.StatusBadRequest, "plan id is required")
		return
	}

	plan, err := h.repo.GetPlanByID(c.Request.Context(), uid, planID)
	if err != nil {
		log.Printf("[ERROR] firestore GetPlanByID (delete check) failed for uid=%s planID=%s: %v", uid, planID, err)
		models.ErrorResponse(c, http.StatusInternalServerError, "failed to retrieve plan")
		return
	}

	if plan == nil {
		models.ErrorResponse(c, http.StatusNotFound, "plan not found")
		return
	}

	if err := h.repo.DeletePlan(c.Request.Context(), uid, planID); err != nil {
		log.Printf("[ERROR] firestore DeletePlan failed for uid=%s planID=%s: %v", uid, planID, err)
		models.ErrorResponse(c, http.StatusInternalServerError, "failed to delete plan")
		return
	}

	models.SuccessResponse(c, "plan deleted successfully", nil)
}

func (h *YogaHandler) AnalyzePose(c *gin.Context) {
	_, ok := h.getUserID(c)
	if !ok {
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
		log.Printf("[ERROR] gemini AnalyzePose failed: %v", err)
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
	prompt := "Generate a yoga plan with these parameters: " +
		"Level: " + req.Level + ". " +
		"Total duration: exactly " + fmt.Sprintf("%d", req.Duration) + " minutes."

	if req.FocusArea != "" {
		prompt += " Focus area: " + req.FocusArea + "." +
			" ALL exercises MUST directly target this focus. If it is a pain condition, use only therapeutic movements and exclude contraindicated poses."
	}

	if req.Preferences != "" {
		prompt += " User notes (ABSOLUTE COMMANDS - must be reflected in every exercise): \"" + req.Preferences + "\"."
	}

	prompt += " Return JSON with this exact schema: " +
		"{" +
		"\"title\": \"motivating title based on focus\"," +
		"\"focus_area\": \"primary focus addressed\"," +
		"\"difficulty\": \"Beginner/Intermediate/Advanced\"," +
		"\"total_duration_min\": integer (must equal sum of all exercise duration_min)," +
		"\"is_favorite\": false," +
		"\"is_pinned\": false," +
		"\"description\": \"2-sentence explanation of how this plan addresses user's goals\"," +
		"\"exercises\": [{" +
		"\"name\": \"pose name\"," +
		"\"duration_min\": integer," +
		"\"instructions\": \"clear step-by-step guidance\"," +
		"\"focus_point\": \"specific alignment or mental focus cue\"," +
		"\"benefit\": \"why this pose is crucial for user's specific condition\"" +
		"}]" +
		"}"
	return prompt
}

func buildAnalyzePrompt(req AnalyzePoseRequest) string {
	return "As an elite yoga instructor, analyze this pose: " +
		"Pose: " + req.PoseName + ". " +
		"User's description: \"" + req.Description + "\". " +
		"If the user mentions any pain or limitation, tailor advice accordingly. " +
		"Return JSON: {\"pose_name\": string, \"alignment_tips\": [strings], " +
		"\"common_mistakes\": [strings], \"modifications\": [strings], \"benefits\": [strings]}."
}
