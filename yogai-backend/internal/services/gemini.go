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
		"You are an elite Yoga & Wellness Architect. Your sole purpose is to generate highly personalized, safe, and effective yoga plans based on specific user inputs. " +
			"CORE RULES: " +
			"1. INPUT PRIORITY: If user_notes contains specific physical conditions like 'back pain', 'neck tension', or 'knee injury', exclude all contraindicated poses and include only therapeutic movements. " +
			"2. TIME ADAPTATION: Adjust the number of exercises and their individual durations so total_duration_min exactly matches the requested duration. " +
			"3. OUTPUT FORMAT: Respond ONLY with a valid JSON object. No conversational text, no markdown, no explanations. " +
			"4. SAFETY PROTOCOL: Only suggest advanced poses if level is explicitly 'advanced'. For all other levels, prioritize safety and alignment. " +
			"5. DATA INTEGRITY: total_duration_min must be the exact sum of all duration_min values in the exercises list. " +
			"6. Never ignore any part of the user's input. If a note is provided, it must be reflected in every exercise's benefit field.",
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
