package services

import (
	"context"
	"fmt"

	"github.com/google/generative-ai-go/genai"
	"google.golang.org/api/option"
)

type AIService interface {
	GenerateYogaPlan(ctx context.Context, prompt string) (string, error)
	AnalyzePose(ctx context.Context, prompt string) (string, error)
	Close() error
}

type geminiService struct {
	client *genai.Client
	model  *genai.GenerativeModel
}

func NewGeminiService(apiKey string) (AIService, error) {
	ctx := context.Background()

	client, err := genai.NewClient(ctx, option.WithAPIKey(apiKey))
	if err != nil {
		return nil, fmt.Errorf("failed to create gemini client: %w", err)
	}

	model := client.GenerativeModel("gemini-2.5-flash")
	model.SetTemperature(0.7)
	model.ResponseMIMEType = "application/json"
	model.SystemInstruction = genai.NewUserContent(genai.Text(
		"You are YogAI, a professional Yoga and Wellness instructor. " +
			"The 'focus_area' and 'preferences' fields from the user are your primary guides. " +
			"If the user selects 'Back Pain', every exercise MUST target back relief. " +
			"If the user provides extra notes (e.g. 'my knee hurts', 'I only have 10 minutes'), " +
			"you MUST respect those constraints 100% and personalize the plan accordingly. " +
			"Never ignore user-provided notes. " +
			"Always respond with valid JSON only. No markdown, no explanation outside JSON.",
	))

	return &geminiService{
		client: client,
		model:  model,
	}, nil
}

func (s *geminiService) GenerateYogaPlan(ctx context.Context, prompt string) (string, error) {
	resp, err := s.model.GenerateContent(ctx, genai.Text(prompt))
	if err != nil {
		return "", fmt.Errorf("failed to generate yoga plan: %w", err)
	}

	text := extractText(resp)
	if text == "" {
		return "", fmt.Errorf("empty response from gemini")
	}

	return text, nil
}

func (s *geminiService) AnalyzePose(ctx context.Context, prompt string) (string, error) {
	resp, err := s.model.GenerateContent(ctx, genai.Text(prompt))
	if err != nil {
		return "", fmt.Errorf("failed to analyze pose: %w", err)
	}

	text := extractText(resp)
	if text == "" {
		return "", fmt.Errorf("empty response from gemini")
	}

	return text, nil
}

func (s *geminiService) Close() error {
	s.client.Close()
	return nil
}

func extractText(resp *genai.GenerateContentResponse) string {
	if resp == nil || len(resp.Candidates) == 0 {
		return ""
	}

	candidate := resp.Candidates[0]
	if candidate.Content == nil || len(candidate.Content.Parts) == 0 {
		return ""
	}

	var result string
	for _, part := range candidate.Content.Parts {
		if text, ok := part.(genai.Text); ok {
			result += string(text)
		}
	}

	return result
}
