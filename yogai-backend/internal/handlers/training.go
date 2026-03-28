package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/omerkisa/yogai-backend/internal/models"
	"github.com/omerkisa/yogai-backend/internal/repository"
)

type TrainingHandler struct {
	repo repository.TrainingRepository
}

func NewTrainingHandler(repo repository.TrainingRepository) *TrainingHandler {
	return &TrainingHandler{repo: repo}
}

func (h *TrainingHandler) getUserID(c *gin.Context) (string, bool) {
	uid, exists := c.Get("user_id")
	if !exists {
		models.ErrorResponse(c, http.StatusUnauthorized, "user not authenticated")
		return "", false
	}
	return uid.(string), true
}

func (h *TrainingHandler) StartSession(c *gin.Context) {
	uid, ok := h.getUserID(c)
	if !ok {
		return
	}

	var req struct {
		PlanID string `json:"plan_id" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		models.ErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	active, err := h.repo.GetActiveSession(c.Request.Context(), uid)
	if err != nil {
		models.ErrorResponse(c, http.StatusInternalServerError, "failed to check active sessions")
		return
	}
	if active != nil {
		if time.Since(active.StartedAt) > 2 * time.Hour {
			_ = h.repo.UpdateSession(c.Request.Context(), uid, active.ID, map[string]interface{}{
				"status": "expired",
			})
		} else {
			models.ErrorResponse(c, http.StatusConflict, "there is already an active session")
			return
		}
	}

	session := &models.TrainingSession{
		PlanID:    req.PlanID,
		StartedAt: time.Now(),
		Status:    "active",
	}

	if err := h.repo.CreateSession(c.Request.Context(), uid, session); err != nil {
		models.ErrorResponse(c, http.StatusInternalServerError, "failed to start session")
		return
	}

	models.SuccessResponse(c, "session started", session)
}

func (h *TrainingHandler) SavePose(c *gin.Context) {
	uid, ok := h.getUserID(c)
	if !ok {
		return
	}

	sessionID := c.Param("id")

	var req struct {
		PoseID          string  `json:"pose_id" binding:"required"`
		Accuracy        float64 `json:"accuracy" binding:"required"`
		DurationSeconds int     `json:"duration_seconds" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		models.ErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	result := &models.PoseResult{
		PoseID:          req.PoseID,
		Accuracy:        req.Accuracy,
		DurationSeconds: req.DurationSeconds,
		CompletedAt:     time.Now(),
	}

	if err := h.repo.SavePoseResult(c.Request.Context(), uid, sessionID, result); err != nil {
		models.ErrorResponse(c, http.StatusInternalServerError, "failed to save pose result")
		return
	}

	models.SuccessResponse(c, "pose result saved", result)
}

func (h *TrainingHandler) CompleteSession(c *gin.Context) {
	uid, ok := h.getUserID(c)
	if !ok {
		return
	}

	sessionID := c.Param("id")

	results, err := h.repo.GetPoseResults(c.Request.Context(), uid, sessionID)
	if err != nil {
		models.ErrorResponse(c, http.StatusInternalServerError, "failed to get pose results")
		return
	}

	var totalAcc float64
	var totalDur int
	poseCount := len(results)

	for _, r := range results {
		totalAcc += r.Accuracy
		totalDur += r.DurationSeconds
	}

	avgAcc := 0.0
	if poseCount > 0 {
		avgAcc = totalAcc / float64(poseCount)
	}

	now := time.Now()
	valMap := map[string]interface{}{
		"status":         "completed",
		"total_accuracy": avgAcc,
		"total_duration": totalDur,
		"pose_count":     poseCount,
		"completed_at":   now,
	}

	if err := h.repo.UpdateSession(c.Request.Context(), uid, sessionID, valMap); err != nil {
		models.ErrorResponse(c, http.StatusInternalServerError, "failed to complete session")
		return
	}

	models.SuccessResponse(c, "session completed", gin.H{
		"session_id":     sessionID,
		"total_accuracy": avgAcc,
		"total_duration": totalDur,
		"pose_count":     poseCount,
	})
}

func (h *TrainingHandler) GetSessions(c *gin.Context) {
	uid, ok := h.getUserID(c)
	if !ok {
		return
	}

	sessions, err := h.repo.GetSessions(c.Request.Context(), uid)
	if err != nil {
		models.ErrorResponse(c, http.StatusInternalServerError, "failed to retrieve sessions")
		return
	}

	models.SuccessResponse(c, "sessions retrieved", sessions)
}

func (h *TrainingHandler) GetSessionByID(c *gin.Context) {
	uid, ok := h.getUserID(c)
	if !ok {
		return
	}

	sessionID := c.Param("id")
	session, err := h.repo.GetSessionByID(c.Request.Context(), uid, sessionID)
	if err != nil {
		models.ErrorResponse(c, http.StatusInternalServerError, "failed to retrieve session")
		return
	}
	if session == nil {
		models.ErrorResponse(c, http.StatusNotFound, "session not found")
		return
	}

	results, err := h.repo.GetPoseResults(c.Request.Context(), uid, sessionID)
	if err != nil {
		results = []*models.PoseResult{}
	}

	models.SuccessResponse(c, "session retrieved", gin.H{
		"session": session,
		"results": results,
	})
}

func (h *TrainingHandler) GetStats(c *gin.Context) {
	uid, ok := h.getUserID(c)
	if !ok {
		return
	}

	sessions, err := h.repo.GetSessions(c.Request.Context(), uid)
	if err != nil {
		models.ErrorResponse(c, http.StatusInternalServerError, "failed to retrieve sessions")
		return
	}

	completedCount := 0
	var totalAcc float64
	var totalDur int

	for _, s := range sessions {
		if s.Status == "completed" {
			completedCount++
			totalAcc += s.TotalAccuracy
			totalDur += s.TotalDuration
		}
	}

	avgAcc := 0.0
	if completedCount > 0 {
		avgAcc = totalAcc / float64(completedCount)
	}

	models.SuccessResponse(c, "stats retrieved", gin.H{
		"total_completed_sessions": completedCount,
		"overall_accuracy":         avgAcc,
		"total_duration_spent":     totalDur,
	})
}
