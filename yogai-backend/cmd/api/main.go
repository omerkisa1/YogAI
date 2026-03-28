package main

import (
	"context"
	"log"

	"github.com/gin-gonic/gin"
	"github.com/omerkisa/yogai-backend/internal/handlers"
	"github.com/omerkisa/yogai-backend/internal/middleware"
	"github.com/omerkisa/yogai-backend/internal/repository"
	"github.com/omerkisa/yogai-backend/internal/services"
	"github.com/omerkisa/yogai-backend/pkg/config"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("failed to load config: %v", err)
	}

	ctx := context.Background()

	firebaseApp, err := repository.NewFirebaseApp(ctx, cfg.FirebaseCredentialsFile)
	if err != nil {
		log.Fatalf("failed to initialize firebase: %v", err)
	}
	defer firebaseApp.Close()

	aiService, err := services.NewGeminiService(cfg.GeminiAPIKey)
	if err != nil {
		log.Fatalf("failed to initialize gemini service: %v", err)
	}
	defer aiService.Close()

	yogaRepo := repository.NewYogaRepository(firebaseApp.Firestore)
        profileRepo := repository.NewProfileRepository(firebaseApp.Firestore)
        trainingRepo := repository.NewTrainingRepository(firebaseApp.Firestore)

        yogaHandler := handlers.NewYogaHandler(aiService, yogaRepo, profileRepo)
        profileHandler := handlers.NewProfileHandler(profileRepo)
        trainingHandler := handlers.NewTrainingHandler(trainingRepo)
        catalogHandler := handlers.NewCatalogHandler()

        router := gin.Default()
        router.Use(gin.Recovery())
        router.Use(middleware.CORS())

        api := router.Group("/api/v1")
        {
                api.GET("/health", yogaHandler.HealthCheck)
        }

        authorized := api.Group("")
        authorized.Use(middleware.FirebaseAuth(firebaseApp.Auth))
        {
                authorized.POST("/yoga/plan", yogaHandler.GeneratePlan)
                authorized.GET("/yoga/plans", yogaHandler.GetPlans)
                authorized.GET("/yoga/plans/:id", yogaHandler.GetPlanByID)
                authorized.PATCH("/yoga/plans/:id", yogaHandler.UpdatePlanMeta)
                authorized.DELETE("/yoga/plans/:id", yogaHandler.DeletePlan)
                authorized.POST("/yoga/analyze", yogaHandler.AnalyzePose)

                authorized.GET("/yoga/poses", catalogHandler.GetPoses)
                authorized.GET("/yoga/poses/analyzable", catalogHandler.GetAnalyzablePoses)
                authorized.GET("/yoga/poses/:id", catalogHandler.GetPoseByID)

                authorized.POST("/training/start", trainingHandler.StartSession)
                authorized.POST("/training/sessions/:id/pose", trainingHandler.SavePose)
                authorized.POST("/training/sessions/:id/complete", trainingHandler.CompleteSession)
                authorized.GET("/training/sessions", trainingHandler.GetSessions)
                authorized.GET("/training/sessions/:id", trainingHandler.GetSessionByID)
                authorized.GET("/training/stats", trainingHandler.GetStats)
		authorized.GET("/profile", profileHandler.GetProfile)
		authorized.PUT("/profile", profileHandler.SaveProfile)
	}

	log.Printf("YogAI server starting on port %s", cfg.ServerPort)
	if err := router.Run(":" + cfg.ServerPort); err != nil {
		log.Fatalf("failed to start server: %v", err)
	}
}
