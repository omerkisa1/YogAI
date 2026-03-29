package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/omerkisa/yogai-backend/internal/models"
	"github.com/omerkisa/yogai-backend/internal/repository"
)

type ProfileHandler struct {
	repo repository.ProfileRepository
}

func NewProfileHandler(repo repository.ProfileRepository) *ProfileHandler {
	return &ProfileHandler{repo: repo}
}

type SaveProfileRequest struct {
	DisplayName       *string   `json:"display_name"`
	BirthYear         *int      `json:"birth_year"`
	Gender            *string   `json:"gender"`
	HeightCM          *int      `json:"height_cm"`
	WeightKG          *int      `json:"weight_kg"`
	FitnessLevel      *string   `json:"fitness_level"`
	Injuries          *[]string `json:"injuries"`
	Goals             *[]string `json:"goals"`
	PreferredDuration *int      `json:"preferred_duration"`
	ProfileImageURL   *string   `json:"profile_image_url"`
	Platform          *string   `json:"platform"`
	LastLoginAt       *string   `json:"last_login_at"`
	AuthProvider      *string   `json:"auth_provider"`
}

func (h *ProfileHandler) GetProfile(c *gin.Context) {
	uid, exists := c.Get("user_id")
	if !exists {
		models.ErrorResponse(c, http.StatusUnauthorized, "user not authenticated")
		return
	}

	profile, err := h.repo.GetProfile(c.Request.Context(), uid.(string))
	if err != nil {
		models.ErrorResponse(c, http.StatusInternalServerError, "failed to get profile")
		return
	}

	if profile == nil {
		models.SuccessResponse(c, "no profile found", nil)
		return
	}

	models.SuccessResponse(c, "profile retrieved", gin.H{
		"display_name":       profile.DisplayName,
		"birth_year":         profile.BirthYear,
		"gender":             profile.Gender,
		"height_cm":          profile.HeightCM,
		"weight_kg":          profile.WeightKG,
		"fitness_level":      profile.FitnessLevel,
		"injuries":           profile.Injuries,
		"goals":              profile.Goals,
		"preferred_duration": profile.PreferredDuration,
		"profile_image_url":  profile.ProfileImageURL,
		"platform":           profile.Platform,
		"last_login_at":      profile.LastLoginAt,
		"auth_provider":      profile.AuthProvider,
		"created_at":         profile.CreatedAt,
		"updated_at":         profile.UpdatedAt,
	})
}

func (h *ProfileHandler) SaveProfile(c *gin.Context) {
	uid, exists := c.Get("user_id")
	if !exists {
		models.ErrorResponse(c, http.StatusUnauthorized, "user not authenticated")
		return
	}

	var req SaveProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		models.ErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	existingProfile, err := h.repo.GetProfile(c.Request.Context(), uid.(string))
	if err != nil {
		models.ErrorResponse(c, http.StatusInternalServerError, "failed to get profile")
		return
	}

	profile := &repository.UserProfile{}
	if existingProfile != nil {
		profile = existingProfile
	}

	if req.DisplayName != nil {
		profile.DisplayName = *req.DisplayName
	}
	if req.BirthYear != nil {
		profile.BirthYear = *req.BirthYear
	}
	if req.Gender != nil {
		profile.Gender = *req.Gender
	}
	if req.HeightCM != nil {
		profile.HeightCM = *req.HeightCM
	}
	if req.WeightKG != nil {
		profile.WeightKG = *req.WeightKG
	}
	if req.FitnessLevel != nil {
		profile.FitnessLevel = *req.FitnessLevel
	}
	if req.Injuries != nil {
		profile.Injuries = *req.Injuries
	}
	if req.Goals != nil {
		profile.Goals = *req.Goals
	}
	if req.PreferredDuration != nil {
		profile.PreferredDuration = *req.PreferredDuration
	}
	if req.ProfileImageURL != nil {
		profile.ProfileImageURL = *req.ProfileImageURL
	}
	if req.Platform != nil {
		profile.Platform = *req.Platform
	}
	if req.LastLoginAt != nil {
		profile.LastLoginAt = *req.LastLoginAt
	}
	if req.AuthProvider != nil {
		profile.AuthProvider = *req.AuthProvider
	}

	if profile.Injuries == nil {
		profile.Injuries = []string{}
	}
	if profile.Goals == nil {
		profile.Goals = []string{}
	}

	if err := h.repo.SaveProfile(c.Request.Context(), uid.(string), profile); err != nil {
		models.ErrorResponse(c, http.StatusInternalServerError, "failed to save profile")
		return
	}

	models.SuccessResponse(c, "profile saved", gin.H{
		"display_name":       profile.DisplayName,
		"birth_year":         profile.BirthYear,
		"gender":             profile.Gender,
		"height_cm":          profile.HeightCM,
		"weight_kg":          profile.WeightKG,
		"fitness_level":      profile.FitnessLevel,
		"injuries":           profile.Injuries,
		"goals":              profile.Goals,
		"preferred_duration": profile.PreferredDuration,
		"profile_image_url":  profile.ProfileImageURL,
		"platform":           profile.Platform,
		"last_login_at":      profile.LastLoginAt,
		"auth_provider":      profile.AuthProvider,
		"created_at":         profile.CreatedAt,
		"updated_at":         profile.UpdatedAt,
	})
}
