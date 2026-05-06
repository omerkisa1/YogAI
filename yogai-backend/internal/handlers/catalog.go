package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/omerkisa/yogai-backend/internal/catalog"
	"github.com/omerkisa/yogai-backend/internal/models"
)

type CatalogHandler struct{}

func NewCatalogHandler() *CatalogHandler {
	return &CatalogHandler{}
}

func (h *CatalogHandler) GetPoses(c *gin.Context) {
	poses := catalog.GetAllPoses()

	type PoseMeta struct {
		PoseID            string   `json:"pose_id"`
		NameEN            string   `json:"name_en"`
		NameTR            string   `json:"name_tr"`
		Category          string   `json:"category"`
		Difficulty        int      `json:"difficulty"`
		TargetArea        string   `json:"target_area"`
		InstructionsEN    string   `json:"instructions_en"`
		InstructionsTR    string   `json:"instructions_tr"`
		Contraindications []string `json:"contraindications"`
		IsAnalyzable      bool     `json:"is_analyzable"`
	}

	metaList := make([]PoseMeta, 0, len(poses))
	for _, p := range poses {
		contraindications := p.Contraindications
		if contraindications == nil {
			contraindications = []string{}
		}
		metaList = append(metaList, PoseMeta{
			PoseID:            p.PoseID,
			NameEN:            p.NameEN,
			NameTR:            p.NameTR,
			Category:          string(p.Category),
			Difficulty:        p.Difficulty,
			TargetArea:        p.TargetArea,
			InstructionsEN:    p.InstructionsEN,
			InstructionsTR:    p.InstructionsTR,
			Contraindications: contraindications,
			IsAnalyzable:      p.IsAnalyzable,
		})
	}

	models.SuccessResponse(c, "poses retrieved", metaList)
}

func (h *CatalogHandler) GetAnalyzablePoses(c *gin.Context) {
	poses := catalog.GetAnalyzablePoses()
	models.SuccessResponse(c, "analyzable poses retrieved", poses)
}

func (h *CatalogHandler) GetPoseByID(c *gin.Context) {
	id := c.Param("id")
	pose, ok := catalog.GetPoseByID(id)
	if !ok {
		models.ErrorResponse(c, http.StatusNotFound, "pose not found")
		return
	}
	models.SuccessResponse(c, "pose details retrieved", pose)
}
