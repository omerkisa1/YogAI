package handlers

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/omerkisa/yogai-backend/internal/catalog"
	"github.com/omerkisa/yogai-backend/internal/models"
	"github.com/omerkisa/yogai-backend/internal/repository"
	"github.com/omerkisa/yogai-backend/internal/services"
)

type YogaHandler struct {
	aiService   services.AIService
	repo        repository.YogaRepository
	profileRepo repository.ProfileRepository
}

func NewYogaHandler(aiService services.AIService, repo repository.YogaRepository, profileRepo repository.ProfileRepository) *YogaHandler {
	return &YogaHandler{
		aiService:   aiService,
		repo:        repo,
		profileRepo: profileRepo,
	}
}

type GeneratePlanRequest struct {
	Level       string `json:"level" binding:"required"`
	Duration    int    `json:"duration" binding:"required"`
	FocusArea   string `json:"focus_area"`
	Preferences string `json:"preferences"`
}

type UpdatePlanMetaRequest struct {
	IsFavorite *bool `json:"is_favorite"`
	IsPinned   *bool `json:"is_pinned"`
}

// type removed

type BilingualExercise struct {
	PoseID         string `json:"pose_id"`
	NameEN         string `json:"name_en"`
	NameTR         string `json:"name_tr"`
	DurationMin    int    `json:"duration_min"`
	InstructionsEN string `json:"instructions_en"`
	InstructionsTR string `json:"instructions_tr"`
	BenefitEN      string `json:"benefit_en"`
	BenefitTR      string `json:"benefit_tr"`
	TargetArea     string `json:"target_area"`
	Category       string `json:"category"`
}

type BilingualPlan struct {
	TitleEN          string              `json:"title_en"`
	TitleTR          string              `json:"title_tr"`
	FocusArea        string              `json:"focus_area"`
	Difficulty       string              `json:"difficulty"`
	TotalDurationMin int                 `json:"total_duration_min"`
	DescriptionEN    string              `json:"description_en"`
	DescriptionTR    string              `json:"description_tr"`
	IsFavorite       bool                `json:"is_favorite"`
	IsPinned         bool                `json:"is_pinned"`
	Exercises        []BilingualExercise `json:"exercises"`
}

func (h *YogaHandler) getUserID(c *gin.Context) (string, bool) {
	uid, exists := c.Get("user_id")
	if !exists {
		models.ErrorResponse(c, http.StatusUnauthorized, "user not authenticated")
		return "", false
	}
	return uid.(string), true
}

func validateAndEnrich(raw string) (*BilingualPlan, error) {
	var llmResp services.LLMPlanResponse
	if err := json.Unmarshal([]byte(raw), &llmResp); err != nil {
                return nil, fmt.Errorf("invalid JSON from LLM: %w", err)
        }

        if llmResp.TitleEN == "" && llmResp.TitleTR == "" {
                return nil, fmt.Errorf("LLM response missing title")
        }

        if len(llmResp.Exercises) == 0 {
                return nil, fmt.Errorf("LLM response has no exercises")
        }

        plan := &BilingualPlan{
                TitleEN:          llmResp.TitleEN,
                TitleTR:          llmResp.TitleTR,
                FocusArea:        llmResp.FocusArea,
                Difficulty:       llmResp.Difficulty,
                TotalDurationMin: 0,
                DescriptionEN:    llmResp.DescriptionEN,
                DescriptionTR:    llmResp.DescriptionTR,
                IsFavorite:       false,
                IsPinned:         false,
                Exercises:        make([]BilingualExercise, 0),
        }

        var validExercises []BilingualExercise
        actualDuration := 0

        for _, ex := range llmResp.Exercises {
                pose, exists := catalog.GetPoseByID(ex.PoseID)
                if !exists {
                        log.Printf("[WARN] LLM returned invalid pose_id %q (not in catalog), skipping...", ex.PoseID)
                        continue
                }

                if ex.Duration <= 0 {
                        log.Printf("[WARN] LLM returned invalid duration %d for pose %q, skipping...", ex.Duration, ex.PoseID)
                        continue
                }

                validExercises = append(validExercises, BilingualExercise{
                        PoseID:         ex.PoseID,
                        NameEN:         pose.NameEN,
                        NameTR:         pose.NameTR,
                        DurationMin:    ex.Duration,
                        InstructionsEN: pose.InstructionsEN,
                        InstructionsTR: pose.InstructionsTR,
                        BenefitEN:      ex.BenefitEN,
                        BenefitTR:      ex.BenefitTR,
                        TargetArea:     pose.TargetArea,
                        Category:       string(pose.Category),
                })
                actualDuration += ex.Duration
        }

        if len(validExercises) == 0 {
                return nil, fmt.Errorf("no valid exercises returned by LLM after filtering")
        }

        plan.Exercises = validExercises
        plan.TotalDurationMin = actualDuration

        return plan, nil
}

func parsePlanJSON(raw string) interface{} {
	if raw == "" {
		return nil
	}
	var parsed interface{}
	if err := json.Unmarshal([]byte(raw), &parsed); err != nil {
		return raw
	}
	return parsed
}

func planToResponse(p *repository.YogaPlan) gin.H {
	planEN := parsePlanJSON(p.PlanEN)
	planTR := parsePlanJSON(p.PlanTR)

	if planEN == nil && p.Plan != "" {
		planEN = parsePlanJSON(p.Plan)
	}

	return gin.H{
		"id":          p.ID,
		"plan_en":     planEN,
		"plan_tr":     planTR,
		"level":       p.Level,
		"duration":    p.Duration,
		"focus_area":  p.FocusArea,
		"is_favorite": p.IsFavorite,
		"is_pinned":   p.IsPinned,
		"created_at":  p.CreatedAt,
	}
}

func bilingualPlanToResponse(p *repository.YogaPlan, bilingual *BilingualPlan) gin.H {
	return gin.H{
		"id":          p.ID,
		"plan":        bilingual,
		"level":       p.Level,
		"duration":    p.Duration,
		"focus_area":  p.FocusArea,
		"is_favorite": p.IsFavorite,
		"is_pinned":   p.IsPinned,
		"created_at":  p.CreatedAt,
	}
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

	var profileInjuries []string
	profile, _ := h.profileRepo.GetProfile(c.Request.Context(), uid)
	if profile != nil && len(profile.Injuries) > 0 {
		profileInjuries = profile.Injuries
	}

	safePoseIDs := catalog.GetSafePoseIDs(profileInjuries)
	poseIDList := strings.Join(safePoseIDs, ", ")

	prompt := buildBilingualPlanPrompt(req, profileInjuries, poseIDList)

	result, err := h.aiService.GenerateYogaPlan(c.Request.Context(), prompt)
	if err != nil {
		log.Printf("[ERROR] gemini GenerateYogaPlan failed for uid=%s: %v", uid, err)
		models.ErrorResponse(c, http.StatusInternalServerError, "failed to generate yoga plan")
		return
	}

	bilingual, err := validateAndEnrich(result)
	if err != nil {
		log.Printf("[ERROR] plan validation/enrichment failed for uid=%s: %v | raw_response_length=%d", uid, err, len(result))
		models.ErrorResponse(c, http.StatusInternalServerError, "AI produced invalid plan data: "+err.Error())
		return
	}

	planBytes, _ := json.Marshal(bilingual)
	planJSON := string(planBytes)

	plan := &repository.YogaPlan{
		PlanEN:    planJSON,
		PlanTR:    planJSON,
		Level:     req.Level,
		Duration:  req.Duration,
		FocusArea: req.FocusArea,
	}

	if err := h.repo.SavePlan(c.Request.Context(), uid, plan); err != nil {
		log.Printf("[ERROR] firestore SavePlan failed for uid=%s: %v", uid, err)
		models.ErrorResponse(c, http.StatusInternalServerError, "failed to save yoga plan")
		return
	}

	models.CreatedResponse(c, "yoga plan generated and saved", bilingualPlanToResponse(plan, bilingual))
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
		parsedPlans = append(parsedPlans, planToResponse(p))
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

	models.SuccessResponse(c, "plan retrieved successfully", planToResponse(plan))
}

func (h *YogaHandler) UpdatePlanMeta(c *gin.Context) {
	uid, ok := h.getUserID(c)
	if !ok {
		return
	}

	planID := c.Param("id")
	if planID == "" {
		models.ErrorResponse(c, http.StatusBadRequest, "plan id is required")
		return
	}

	var req UpdatePlanMetaRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		models.ErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	if req.IsFavorite == nil && req.IsPinned == nil {
		models.ErrorResponse(c, http.StatusBadRequest, "at least one field (is_favorite or is_pinned) is required")
		return
	}

	fields := make(map[string]interface{})
	if req.IsFavorite != nil {
		fields["is_favorite"] = *req.IsFavorite
	}
	if req.IsPinned != nil {
		fields["is_pinned"] = *req.IsPinned
	}

	if err := h.repo.UpdatePlanMeta(c.Request.Context(), uid, planID, fields); err != nil {
		log.Printf("[ERROR] firestore UpdatePlanMeta failed for uid=%s planID=%s: %v", uid, planID, err)
		models.ErrorResponse(c, http.StatusInternalServerError, "failed to update plan")
		return
	}

	plan, err := h.repo.GetPlanByID(c.Request.Context(), uid, planID)
	if err != nil || plan == nil {
		models.SuccessResponse(c, "plan updated successfully", nil)
		return
	}

	models.SuccessResponse(c, "plan updated successfully", planToResponse(plan))
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

        var req services.AnalyzeRequest
        if err := c.ShouldBindJSON(&req); err != nil {
                models.ErrorResponse(c, http.StatusBadRequest, err.Error())
                return
        }

        analysis, err := services.AnalyzePoseLandmarks(req)
        if err != nil {
                log.Printf("[ERROR] AnalyzePoseLandmarks failed: %v", err)
                models.ErrorResponse(c, http.StatusInternalServerError, "failed to analyze pose: "+err.Error())
                return
        }

        models.SuccessResponse(c, "pose analyzed successfully", analysis)
}

func (h *YogaHandler) HealthCheck(c *gin.Context) {
	poses := catalog.GetAllPoses()
	catalogCount := len(poses)

	categories := make(map[catalog.Category]int)
	for _, p := range poses {
		categories[p.Category]++
	}
	
	catReport := make(gin.H, len(categories))
	for cat, count := range categories {
		catReport[string(cat)] = count
	}

	models.SuccessResponse(c, "YogAI API is running", gin.H{
		"catalog_loaded":     catalogCount > 0,
		"total_poses":        catalogCount,
		"categories":         catReport,
		"gemini_configured":  true,
		"firestore_configured": true,
	})
}

func buildBilingualPlanPrompt(req GeneratePlanRequest, injuries []string, poseIDList string) string {
	prompt := "Generate a bilingual yoga plan with these parameters: " +
		"Level: " + req.Level + ". " +
		"Total duration: exactly " + fmt.Sprintf("%d", req.Duration) + " minutes."

	prompt += " ALLOWED POSE IDS (you MUST only pick from this list): [" + poseIDList + "]."

	if req.FocusArea != "" {
		prompt += " Focus area: " + req.FocusArea + "." +
			" ALL exercises MUST directly target this focus. If it is a pain condition, use only therapeutic movements."
	}

	if len(injuries) > 0 {
		prompt += " CRITICAL SAFETY - User has the following medical conditions/injuries: [" + strings.Join(injuries, ", ") + "]. " +
			"The allowed_pose_ids list has already been pre-filtered to exclude contraindicated poses. Only pick from the allowed list."
	}

	if req.Preferences != "" {
		prompt += " User notes (ABSOLUTE COMMANDS - must be reflected in every exercise benefit): \"" + req.Preferences + "\"."
	}

	prompt += " Return a SINGLE JSON with BOTH English and Turkish text. Exact schema: " +
		"{" +
		"\"title_en\": \"motivating English title\"," +
		"\"title_tr\": \"motivating Turkish title\"," +
		"\"focus_area\": \"primary focus addressed\"," +
		"\"difficulty\": \"Beginner/Intermediate/Advanced\"," +
		"\"total_duration_min\": integer (must equal sum of all exercise duration_min)," +
		"\"description_en\": \"2-sentence English explanation of how this plan addresses user goals\"," +
		"\"description_tr\": \"2-sentence Turkish explanation of how this plan addresses user goals\"," +
		"\"exercises\": [{" +
		"\"pose_id\": \"exact pose_id from the allowed list\"," +
		"\"duration_min\": integer," +
		"\"benefit_en\": \"English explanation of why this pose helps this user\"," +
		"\"benefit_tr\": \"Turkish explanation of why this pose helps this user\"" +
		"}]" +
		"}"
	return prompt
}

// buildAnalyzePrompt removed
