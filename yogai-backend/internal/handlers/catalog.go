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
	
	// Create lightweight response without full rules
	type PoseMeta struct {
		PoseID       string `json:"pose_id"`
		NameEN       string `json:"name_en"`
		NameTR       string `json:"name_tr"`
		Difficulty   int    `json:"difficulty"`
		IsAnalyzable bool   `json:"is_analyzable"`
	}

	var metaList []PoseMeta
	for _, p := range poses {
		metaList = append(metaList, PoseMeta{
			PoseID:       p.PoseID,
			NameEN:       p.NameEN,
			NameTR:       p.NameTR,
			Difficulty:   p.Difficulty,
			IsAnalyzable: p.IsAnalyzable,
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
