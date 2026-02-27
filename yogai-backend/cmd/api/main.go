package main

import (
	"log"

	"github.com/gin-gonic/gin"
	_ "github.com/lib/pq"
	"github.com/omerkisa/yogai-backend/internal/handlers"
	"github.com/omerkisa/yogai-backend/internal/repository"
	"github.com/omerkisa/yogai-backend/internal/services"
	"github.com/omerkisa/yogai-backend/pkg/config"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("failed to load config: %v", err)
	}

	db, err := repository.ConnectDB(cfg.DSN())
	if err != nil {
		log.Fatalf("failed to connect database: %v", err)
	}
	defer db.Close()

	aiService, err := services.NewGeminiService(cfg.GeminiAPIKey)
	if err != nil {
		log.Fatalf("failed to initialize gemini service: %v", err)
	}
	defer aiService.Close()

	_ = repository.NewYogaRepository(db)

	yogaHandler := handlers.NewYogaHandler(aiService)

	router := gin.Default()

	router.Use(gin.Recovery())

	api := router.Group("/api/v1")
	{
		api.GET("/health", yogaHandler.HealthCheck)
		api.POST("/yoga/plan", yogaHandler.GeneratePlan)
		api.POST("/yoga/analyze", yogaHandler.AnalyzePose)
	}

	log.Printf("YogAI server starting on port %s", cfg.ServerPort)
	if err := router.Run(":" + cfg.ServerPort); err != nil {
		log.Fatalf("failed to start server: %v", err)
	}
}
