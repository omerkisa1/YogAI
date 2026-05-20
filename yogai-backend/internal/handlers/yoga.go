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
	Level       string   `json:"level" binding:"required"`
	Duration    int      `json:"duration" binding:"required"`
	FocusArea   string   `json:"focus_area"`
	Preferences string   `json:"preferences"`
	Injuries    []string `json:"injuries"`
	PlanType    string   `json:"plan_type"`
}

type UpdatePlanMetaRequest struct {
	IsFavorite *bool `json:"is_favorite"`
	IsPinned   *bool `json:"is_pinned"`
}

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
	IsAnalyzable   bool   `json:"is_analyzable"`
	AnalysisKind   string `json:"analysis_kind"`
	MetricType     string `json:"metric_type"`
	RepTarget      int    `json:"rep_target"`
}

type BilingualPlan struct {
	TitleEN             string              `json:"title_en"`
	TitleTR             string              `json:"title_tr"`
	FocusArea           string              `json:"focus_area"`
	Difficulty          string              `json:"difficulty"`
	TotalDurationMin    int                 `json:"total_duration_min"`
	DescriptionEN       string              `json:"description_en"`
	DescriptionTR       string              `json:"description_tr"`
	IsFavorite          bool                `json:"is_favorite"`
	IsPinned            bool                `json:"is_pinned"`
	Exercises           []BilingualExercise `json:"exercises"`
	AnalyzablePoseCount int                 `json:"analyzable_pose_count"`
	TotalPoseCount      int                 `json:"total_pose_count"`
	Source              string              `json:"source,omitempty"`
}

type CustomPlanRequest struct {
	Title     string                `json:"title" binding:"required"`
	Exercises []CustomPlanExercise  `json:"exercises" binding:"required,min=1"`
}

type CustomPlanExercise struct {
	PoseID      string `json:"pose_id" binding:"required"`
	DurationMin int    `json:"duration_min"`
	RepTarget   int    `json:"rep_target"`
}

func (h *YogaHandler) getUserID(c *gin.Context) (string, bool) {
	uid, exists := c.Get("user_id")
	if !exists {
		models.ErrorResponse(c, http.StatusUnauthorized, "user not authenticated")
		return "", false
	}
	return uid.(string), true
}

func normalizePlanType(planType string) string {
	if planType == "face" || planType == "face_hand" {
		return "face"
	}
	return "body"
}

func filterPosesByPlanType(poseIDs []string, planType string) []string {
	if planType == "face" {
		return catalog.FilterToFaceYoga(poseIDs)
	}
	return catalog.FilterToBodyYoga(poseIDs)
}

func posePlanDomain(analysisKind string) string {
	if analysisKind == "face" || analysisKind == "face_hand" {
		return "face"
	}
	return "body"
}

func poseMatchesPlanType(analysisKind, planType string) bool {
	if planType == "face" {
		return analysisKind == "face" || analysisKind == "face_hand"
	}
	return analysisKind == "body"
}

func filterSafePoseIDsForPlan(level, focusArea string, injuries []string, planType string) []string {
	filteredIDs := catalog.GetSafePoseIDs(injuries)
	filteredIDs = filterPosesByPlanType(filteredIDs, normalizePlanType(planType))
	if focusArea != "" && focusArea != "full_body" && focusArea != "full_face" {
		filteredIDs = catalog.GetPosesByTargetArea(filteredIDs, focusArea)
	}
	switch level {
	case "beginner":
		filteredIDs = catalog.GetPosesByMaxDifficulty(filteredIDs, 2)
	case "intermediate":
		filteredIDs = catalog.GetPosesByMaxDifficulty(filteredIDs, 3)
	}
	return filteredIDs
}

func estimatedMinutesForReps(repTarget int) int {
	if repTarget <= 0 {
		return 1
	}
	seconds := repTarget*3 + 10
	minutes := seconds / 60
	if seconds%60 != 0 {
		minutes++
	}
	if minutes < 1 {
		return 1
	}
	return minutes
}

func enrichBilingualExercise(pose *catalog.Pose, duration, repTarget int, benefitEN, benefitTR string) BilingualExercise {
	ex := BilingualExercise{
		PoseID:         pose.PoseID,
		NameEN:         pose.NameEN,
		NameTR:         pose.NameTR,
		InstructionsEN: pose.InstructionsEN,
		InstructionsTR: pose.InstructionsTR,
		BenefitEN:      benefitEN,
		BenefitTR:      benefitTR,
		TargetArea:     pose.TargetArea,
		Category:       string(pose.Category),
		IsAnalyzable:   pose.IsAnalyzable,
		AnalysisKind:   pose.AnalysisKind,
		MetricType:     pose.MetricType,
	}
	if pose.MetricType == "reps" {
		rt := repTarget
		if rt == 0 {
			rt = pose.RepTarget
		}
		if rt < 3 {
			rt = 5
		}
		if rt > 25 {
			rt = 20
		}
		ex.RepTarget = rt
		ex.DurationMin = 0
	} else {
		d := duration
		if d < 1 {
			d = 2
		}
		if d > 8 {
			d = 8
		}
		ex.DurationMin = d
		ex.RepTarget = 0
	}
	return ex
}

func determinePlanType(exercises []BilingualExercise) string {
	hasBody := false
	hasFace := false
	for _, ex := range exercises {
		switch ex.AnalysisKind {
		case "face", "face_hand":
			hasFace = true
		default:
			hasBody = true
		}
	}
	if hasBody && hasFace {
		return "mixed"
	}
	if hasFace {
		return "face_yoga"
	}
	return "body_yoga"
}

func validateAndEnrich(raw string, userInjuries []string, expectedPlanType string) (*BilingualPlan, error) {
	userInjuries = catalog.NormalizeInjuries(userInjuries)
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
	poseCount := make(map[string]int)
	analyzableCount := 0

	for _, ex := range llmResp.Exercises {
		pose, exists := catalog.GetPoseByID(ex.PoseID)
		if !exists {
			log.Printf("[WARN] LLM returned invalid pose_id %q (not in catalog), skipping...", ex.PoseID)
			continue
		}

		if isContraindicated(pose, userInjuries) {
			log.Printf("[WARN] LLM returned contraindicated pose_id %q for injuries %v — skipping", ex.PoseID, userInjuries)
			continue
		}

		if expectedPlanType != "" && !poseMatchesPlanType(pose.AnalysisKind, expectedPlanType) {
			log.Printf("[WARN] LLM returned pose_id %q with analysis_kind %q, expected plan_type %q — skipping", ex.PoseID, pose.AnalysisKind, expectedPlanType)
			continue
		}

		poseCount[ex.PoseID]++
		if poseCount[ex.PoseID] > 2 {
			log.Printf("[WARN] Duplicate pose_id %q appeared %d times — skipping", ex.PoseID, poseCount[ex.PoseID])
			continue
		}

		if pose.MetricType != "reps" && ex.Duration <= 0 {
			log.Printf("[WARN] LLM returned invalid duration %d for pose %q, skipping...", ex.Duration, ex.PoseID)
			continue
		}

		exercise := enrichBilingualExercise(pose, ex.Duration, ex.RepTarget, ex.BenefitEN, ex.BenefitTR)

		validExercises = append(validExercises, exercise)
		if exercise.MetricType == "reps" {
			actualDuration += estimatedMinutesForReps(exercise.RepTarget)
		} else {
			actualDuration += exercise.DurationMin
		}
		if pose.IsAnalyzable {
			analyzableCount++
		}
	}

	if len(validExercises) < 2 {
		return nil, fmt.Errorf("plan validation failed: only %d valid exercises remaining after filtering (minimum 2 required)", len(validExercises))
	}

	plan.Exercises = validExercises
	plan.TotalDurationMin = actualDuration
	plan.AnalyzablePoseCount = analyzableCount
	plan.TotalPoseCount = len(validExercises)

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
		"plan_type":   p.PlanType,
		"source":      p.Source,
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
		"plan_type":   p.PlanType,
		"source":      p.Source,
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

	var injuryPool []string
	profile, _ := h.profileRepo.GetProfile(c.Request.Context(), uid)
	if profile != nil && len(profile.Injuries) > 0 {
		injuryPool = append(injuryPool, profile.Injuries...)
	}
	injuryPool = append(injuryPool, req.Injuries...)
	mergedInjuries := catalog.NormalizeInjuries(injuryPool)

	planType := normalizePlanType(req.PlanType)
	safePoseIDs := filterSafePoseIDsForPlan(req.Level, req.FocusArea, mergedInjuries, planType)

	availableCount, err := preValidatePlanRequest(req.Duration, safePoseIDs)
	if err != nil {
		models.ErrorResponseWithData(c, http.StatusBadRequest, err.Error(), gin.H{
			"available_poses": availableCount,
			"suggestion":      "Odak alanını 'full_body' olarak değiştirmeyi veya süreyi kısaltmayı deneyin.",
		})
		return
	}

	poseIDList := strings.Join(safePoseIDs, ", ")

	prompt := buildBilingualPlanPrompt(req, mergedInjuries, poseIDList, planType)

	result, err := h.aiService.GenerateYogaPlan(c.Request.Context(), prompt, planType)
	if err != nil {
		log.Printf("[ERROR] gemini GenerateYogaPlan failed for uid=%s: %v", uid, err)
		models.ErrorResponse(c, http.StatusInternalServerError, "failed to generate yoga plan")
		return
	}

	bilingual, err := validateAndEnrich(result, mergedInjuries, planType)
	if err != nil {
		log.Printf("[ERROR] plan validation/enrichment failed for uid=%s: %v | raw_response_length=%d", uid, err, len(result))
		models.ErrorResponse(c, http.StatusInternalServerError, "AI produced invalid plan data: "+err.Error())
		return
	}

	planBytes, _ := json.Marshal(bilingual)
	planJSON := string(planBytes)

	storedPlanType := determinePlanType(bilingual.Exercises)

	plan := &repository.YogaPlan{
		PlanEN:    planJSON,
		PlanTR:    planJSON,
		Level:     req.Level,
		Duration:  req.Duration,
		FocusArea: req.FocusArea,
		PlanType:  storedPlanType,
		Source:    "ai",
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

	faceCount := 0
	faceHandCount := 0
	bodyCount := 0
	for _, p := range poses {
		switch p.AnalysisKind {
		case "face":
			faceCount++
		case "face_hand":
			faceHandCount++
		default:
			bodyCount++
		}
	}

	catReport := make(gin.H)
	for cat, count := range catalog.CategoriesWithCounts() {
		catReport[string(cat)] = count
	}

	models.SuccessResponse(c, "YogAI API is running", gin.H{
		"catalog_loaded":      catalogCount > 0,
		"total_poses":         catalogCount,
		"body_poses":          bodyCount,
		"face_poses":          faceCount,
		"face_hand_poses":     faceHandCount,
		"categories":          catReport,
		"gemini_configured":   true,
		"firestore_configured": true,
	})
}

func preValidatePlanRequest(duration int, safePoseIDs []string) (int, error) {
	count := len(safePoseIDs)
	if count < 2 {
		return count, fmt.Errorf(
			"Seçtiğiniz filtrelerle yeterli hareket bulunamadı (%d poz mevcut, minimum 2 gerekli). Odak alanını genişletin veya sakatlık bilgilerinizi güncelleyin.",
			count,
		)
	}
	if duration < 5 {
		return count, fmt.Errorf("minimum antrenman süresi 5 dakikadır")
	}
	if duration > 120 {
		return count, fmt.Errorf("maksimum antrenman süresi 120 dakikadır")
	}
	return count, nil
}

func isContraindicated(pose *catalog.Pose, injuries []string) bool {
	if len(injuries) == 0 {
		return false
	}
	injurySet := make(map[string]bool, len(injuries))
	for _, inj := range injuries {
		injurySet[inj] = true
	}
	for _, c := range pose.Contraindications {
		if injurySet[c] {
			return true
		}
	}
	return false
}

func buildBilingualPlanPrompt(req GeneratePlanRequest, injuries []string, poseIDList string, planType string) string {
	planKind := "body yoga"
	planTypeInstruction := "Bu plan VÜCUT YOGASI hareketlerini içermeli."
	if planType == "face" {
		planKind = "face yoga"
		planTypeInstruction = "Bu plan YÜZ YOGASI hareketlerini içermeli (face_* ve isteğe bağlı face_hand_*)."
	}

	prompt := "Generate a bilingual " + planKind + " plan with these parameters: " +
		"Level: " + req.Level + ". " +
		"Total duration: " + fmt.Sprintf("%d", req.Duration) + " minutes (target; stay within ±2 minutes). " +
		planTypeInstruction + " "

	if planType == "face" {
		prompt += "IMPORTANT: FACE YOGA only — combine face_* and optional face_hand_* from the allowed list. Never use full-body poses. Focus on variety across forehead, eyes, cheeks, mouth, jawline, neck. "
		prompt += "SÜRE VE TEKRAR KURALLARI: Toplam süre yaklaşık " + fmt.Sprintf("%d", req.Duration) + " dakika. Yüz yogasında rep_target (tekrar sayısı) kullan; duration_min tahmini dakika. Her hareket: (rep_target × 3 sn) + 10 sn dinlenme. Kısa (5-10 dk): 5-8 hareket, 8-12 tekrar. Orta (10-20 dk): 8-12 hareket, 10-15 tekrar. Uzun (20+ dk): 12-18 hareket, 12-20 tekrar. Başlangıç: 8-10 tekrar. Orta: 10-15. İleri: 15-20. face_hand: 5-8 tekrar. Kolay hareketlerle başla, gevşetme ile bitir. "
	} else {
		prompt += "SÜRE KURALLARI: Toplam süre " + fmt.Sprintf("%d", req.Duration) + " dakika (±2 dk). Her hareket duration_min 1-8 dakika. Kısa (5-15 dk): 3-5 hareket, 2-4 dk/hareket. Orta (15-30 dk): 5-8 hareket, 2-5 dk. Uzun (30-60 dk): 8-15 hareket, 3-6 dk. Çok uzun (60+ dk): 15-20 hareket, 3-8 dk. Başlangıç: 2-3 dk/hareket. Orta: 3-4 dk. İleri: 4-6 dk, daha az hareket yoğun. Isınma ile başla, savasana ile bitir. Aynı pose_id en fazla 2 kez. "
	}

	prompt += " ALLOWED POSE IDS (you MUST only pick from this list): [" + poseIDList + "]."

	if req.FocusArea != "" && req.FocusArea != "full_face" && req.FocusArea != "full_body" {
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

	exerciseSchema := "\"pose_id\": \"exact pose_id from the allowed list\"," +
		"\"duration_min\": integer," +
		"\"benefit_en\": \"English explanation of why this pose helps this user\"," +
		"\"benefit_tr\": \"Turkish explanation of why this pose helps this user\""
	if planType == "face" {
		exerciseSchema = "\"pose_id\": \"exact pose_id from the allowed list\"," +
			"\"duration_min\": integer (estimated minutes for scheduling)," +
			"\"rep_target\": integer (repetition count)," +
			"\"benefit_en\": \"English explanation\"," +
			"\"benefit_tr\": \"Turkish explanation\""
	}

	prompt += " Return a SINGLE JSON with BOTH English and Turkish text. Exact schema: " +
		"{" +
		"\"title_en\": \"motivating English title\"," +
		"\"title_tr\": \"motivating Turkish title\"," +
		"\"focus_area\": \"primary focus addressed\"," +
		"\"difficulty\": \"Beginner/Intermediate/Advanced\"," +
		"\"total_duration_min\": integer (sum of exercise time; close to requested duration)," +
		"\"description_en\": \"2-sentence English explanation\"," +
		"\"description_tr\": \"2-sentence Turkish explanation\"," +
		"\"exercises\": [{" + exerciseSchema + "}]" +
		"}"

	prompt += " STRICT RULES:" +
		" - ONLY use pose_id from ALLOWED POSE IDS. Any other pose_id is REJECTED." +
		" - Do NOT repeat the same pose_id more than 2 times." +
		" - Total duration close to requested (±2 minutes)." +
		" - For 'beginner': difficulty 1-2 only. 'intermediate': 1-3. 'advanced': any difficulty."

	if planType == "face" {
		prompt += " - Include rep_target for every exercise. duration_min is estimated schedule time per exercise."
	} else {
		prompt += " - Each duration_min between 1 and 8 minutes."
	}

	return prompt
}

func (h *YogaHandler) CreateCustomPlan(c *gin.Context) {
	uid, ok := h.getUserID(c)
	if !ok {
		return
	}

	var req CustomPlanRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		models.ErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	var profileInjuries []string
	profile, _ := h.profileRepo.GetProfile(c.Request.Context(), uid)
	if profile != nil && len(profile.Injuries) > 0 {
		profileInjuries = catalog.NormalizeInjuries(profile.Injuries)
	}

	var exercises []BilingualExercise
	var warnings []string
	totalDuration := 0
	analyzableCount := 0
	maxDifficulty := 0

	// Determine the domain of the first exercise to enforce no mixing.
	var planDomain string
	for _, ex := range req.Exercises {
		pose, exists := catalog.GetPoseByID(ex.PoseID)
		if !exists {
			models.ErrorResponse(c, http.StatusBadRequest, "unknown pose_id: "+ex.PoseID)
			return
		}
		kind := posePlanDomain(pose.AnalysisKind)
		if planDomain == "" {
			planDomain = kind
		} else if planDomain != kind {
			models.ErrorResponse(c, http.StatusBadRequest, "Yüz yogası hareketleri ile normal yoga hareketleri aynı planda birleştirilemez. Lütfen tek bir tür seçin.")
			return
		}
	}

	processedExercises := make([]CustomPlanExercise, len(req.Exercises))
	copy(processedExercises, req.Exercises)

	for i, ex := range processedExercises {
		pose, exists := catalog.GetPoseByID(ex.PoseID)
		if !exists {
			models.ErrorResponse(c, http.StatusBadRequest, "unknown pose_id: "+ex.PoseID)
			return
		}

		if pose.MetricType == "reps" {
			if ex.RepTarget == 0 {
				ex.RepTarget = pose.RepTarget
			}
			if ex.RepTarget < 3 {
				ex.RepTarget = 5
			}
			if ex.RepTarget > 25 {
				ex.RepTarget = 20
			}
			ex.DurationMin = 0
		} else {
			if ex.DurationMin < 1 {
				ex.DurationMin = 3
			}
			if ex.DurationMin > 8 {
				ex.DurationMin = 8
			}
			ex.RepTarget = 0
		}
		processedExercises[i] = ex
	}

	for _, ex := range processedExercises {
		pose, _ := catalog.GetPoseByID(ex.PoseID)

		if isContraindicated(pose, profileInjuries) {
			for _, ci := range pose.Contraindications {
				for _, inj := range profileInjuries {
					if ci == inj {
						warnings = append(warnings,
							fmt.Sprintf("'%s' hareketi %s için önerilmez", pose.NameTR, ci))
					}
				}
			}
		}

		bex := enrichBilingualExercise(pose, ex.DurationMin, ex.RepTarget, "", "")
		exercises = append(exercises, bex)

		if bex.MetricType == "reps" {
			totalDuration += estimatedMinutesForReps(bex.RepTarget)
		} else {
			totalDuration += bex.DurationMin
		}
		if pose.IsAnalyzable {
			analyzableCount++
		}
		if pose.Difficulty > maxDifficulty {
			maxDifficulty = pose.Difficulty
		}
	}

	level := "beginner"
	difficultyLabel := "Beginner"
	if maxDifficulty >= 4 {
		level = "advanced"
		difficultyLabel = "Advanced"
	} else if maxDifficulty >= 3 {
		level = "intermediate"
		difficultyLabel = "Intermediate"
	}

	focusArea := "full_body"
	if planDomain == "face" || planDomain == "face_hand" {
		focusArea = "full_face"
	}

	bilingual := &BilingualPlan{
		TitleEN:             req.Title,
		TitleTR:             req.Title,
		FocusArea:           focusArea,
		Difficulty:          difficultyLabel,
		TotalDurationMin:    totalDuration,
		DescriptionEN:       "Custom plan created by user.",
		DescriptionTR:       "Kullanıcı tarafından oluşturulan özel plan.",
		Exercises:           exercises,
		AnalyzablePoseCount: analyzableCount,
		TotalPoseCount:      len(exercises),
		Source:              "custom",
	}

	planBytes, _ := json.Marshal(bilingual)
	planJSON := string(planBytes)

	storedPlanType := determinePlanType(exercises)

	plan := &repository.YogaPlan{
		PlanEN:    planJSON,
		PlanTR:    planJSON,
		Level:     level,
		Duration:  totalDuration,
		FocusArea: focusArea,
		PlanType:  storedPlanType,
		Source:    "custom",
	}

	if err := h.repo.SavePlan(c.Request.Context(), uid, plan); err != nil {
		log.Printf("[ERROR] firestore SavePlan (custom) failed for uid=%s: %v", uid, err)
		models.ErrorResponse(c, http.StatusInternalServerError, "failed to save custom plan")
		return
	}

	resp := bilingualPlanToResponse(plan, bilingual)
	models.CreatedResponse(c, "custom plan created", gin.H{
		"plan":     resp,
		"warnings": warnings,
	})
}
