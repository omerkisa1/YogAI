package config

import (
	"fmt"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	GeminiAPIKey           string
	FirebaseCredentialsFile string
	ServerPort             string
}

func Load() (*Config, error) {
	_ = godotenv.Load()

	cfg := &Config{
		GeminiAPIKey:           os.Getenv("GEMINI_API_KEY"),
		FirebaseCredentialsFile: os.Getenv("FIREBASE_CREDENTIALS_FILE"),
		ServerPort:             os.Getenv("SERVER_PORT"),
	}

	if cfg.GeminiAPIKey == "" {
		return nil, fmt.Errorf("GEMINI_API_KEY is required")
	}

	if cfg.FirebaseCredentialsFile == "" {
		return nil, fmt.Errorf("FIREBASE_CREDENTIALS_FILE is required")
	}

	if cfg.ServerPort == "" {
		cfg.ServerPort = "8080"
	}

	return cfg, nil
}
