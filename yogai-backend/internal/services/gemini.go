package services

import (
	"context"
	"fmt"
	"time"

	"github.com/google/generative-ai-go/genai"
	"google.golang.org/api/option"
)

const (
	geminiTimeout  = 15 * time.Second
	maxRetries     = 3
	baseRetryDelay = 1 * time.Second
)

type LLMExercise struct {
	PoseID       string `json:"pose_id"`
	DurationMin  int    `json:"duration_min"`
	Instructions string `json:"instructions"`
	FocusPoint   string `json:"focus_point"`
	Benefit      string `json:"benefit"`
}

type LLMPlanResponse struct {
	Title            string        `json:"title"`
	FocusArea        string        `json:"focus_area"`
	Difficulty       string        `json:"difficulty"`
	TotalDurationMin int           `json:"total_duration_min"`
	IsFavorite       bool          `json:"is_favorite"`
	IsPinned         bool          `json:"is_pinned"`
	Description      string        `json:"description"`
	Exercises        []LLMExercise `json:"exercises"`
}

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
			"ABSOLUTE RULES: " +
			"1. POSE SELECTION: You may ONLY use pose_id values from the allowed_pose_ids list provided in the prompt. You MUST NOT invent, fabricate, or use any pose_id that is not in that list. Every exercise in your response MUST have a pose_id field that exactly matches one from the allowed list. " +
			"2. INPUT PRIORITY: If user_notes contains specific physical conditions like 'back pain', 'neck tension', or 'knee injury', the allowed_pose_ids list has already been pre-filtered for safety. Only use poses from that list. " +
			"3. TIME ADAPTATION: Adjust the number of exercises and their individual durations so total_duration_min exactly matches the requested duration. " +
			"4. OUTPUT FORMAT: Respond ONLY with a valid JSON object matching the exact schema given. No conversational text, no markdown, no explanations. " +
			"5. SAFETY PROTOCOL: Only suggest advanced poses if level is explicitly 'advanced'. For all other levels, prioritize safety and alignment. " +
			"6. DATA INTEGRITY: total_duration_min must be the exact sum of all duration_min values in the exercises list. " +
			"7. Never ignore any part of the user's input. If a note is provided, it must be reflected in every exercise's benefit field. " +
			"8. LANGUAGE: Follow the language instruction from the prompt exactly. If Turkish is requested, write title, description, instructions, focus_point, and benefit in Turkish. pose_id values MUST remain exactly as given in the allowed list.",
	))

	return &geminiService{
		client: client,
		model:  model,
	}, nil
}

func (s *geminiService) GenerateYogaPlan(ctx context.Context, prompt string) (string, error) {
	var lastErr error
	for attempt := 0; attempt < maxRetries; attempt++ {
		if attempt > 0 {
			delay := baseRetryDelay * time.Duration(1<<uint(attempt-1))
			time.Sleep(delay)
		}

		timeoutCtx, cancel := context.WithTimeout(ctx, geminiTimeout)
		resp, err := s.model.GenerateContent(timeoutCtx, genai.Text(prompt))
		cancel()

		if err != nil {
			lastErr = fmt.Errorf("attempt %d: failed to generate yoga plan: %w", attempt+1, err)
			continue
		}

		text := extractText(resp)
		if text == "" {
			lastErr = fmt.Errorf("attempt %d: empty response from gemini", attempt+1)
			continue
		}

		return text, nil
	}
	return "", fmt.Errorf("all %d attempts failed: %w", maxRetries, lastErr)
}

func (s *geminiService) AnalyzePose(ctx context.Context, prompt string) (string, error) {
	var lastErr error
	for attempt := 0; attempt < maxRetries; attempt++ {
		if attempt > 0 {
			delay := baseRetryDelay * time.Duration(1<<uint(attempt-1))
			time.Sleep(delay)
		}

		timeoutCtx, cancel := context.WithTimeout(ctx, geminiTimeout)
		resp, err := s.model.GenerateContent(timeoutCtx, genai.Text(prompt))
		cancel()

		if err != nil {
			lastErr = fmt.Errorf("attempt %d: failed to analyze pose: %w", attempt+1, err)
			continue
		}

		text := extractText(resp)
		if text == "" {
			lastErr = fmt.Errorf("attempt %d: empty response from gemini", attempt+1)
			continue
		}

		return text, nil
	}
	return "", fmt.Errorf("all %d attempts failed: %w", maxRetries, lastErr)
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
