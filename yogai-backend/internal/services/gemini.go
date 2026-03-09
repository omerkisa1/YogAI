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
	PoseID    string `json:"pose_id"`
	Duration  int    `json:"duration_min"`
	BenefitEN string `json:"benefit_en"`
	BenefitTR string `json:"benefit_tr"`
}

type LLMPlanResponse struct {
	TitleEN          string        `json:"title_en"`
	TitleTR          string        `json:"title_tr"`
	FocusArea        string        `json:"focus_area"`
	Difficulty       string        `json:"difficulty"`
	TotalDurationMin int           `json:"total_duration_min"`
	DescriptionEN    string        `json:"description_en"`
	DescriptionTR    string        `json:"description_tr"`
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
		"You are an elite Yoga & Wellness Architect. You generate bilingual (English + Turkish) yoga plans in a SINGLE JSON response. " +
			"ABSOLUTE RULES: " +
			"1. POSE SELECTION: You may ONLY use pose_id values from the allowed_pose_ids list provided in the prompt. You MUST NOT invent or fabricate any pose_id. " +
			"2. BILINGUAL OUTPUT: Every text field has both _en and _tr variants. Write English text in _en fields and Turkish text in _tr fields. pose_id values are always English identifiers. " +
			"3. MINIMAL EXERCISE DATA: For each exercise, return ONLY pose_id, duration_min, benefit_en, and benefit_tr. Do NOT include instructions, name, or focus_point — those are provided by our catalog. " +
			"4. TIME ADAPTATION: Adjust exercises and durations so total_duration_min exactly matches the requested duration. total_duration_min must equal the sum of all exercise duration_min values. " +
			"5. SAFETY: The allowed_pose_ids list has already been pre-filtered for user injuries. Only pick from that list. Only suggest advanced poses if level is explicitly 'advanced'. " +
			"6. PERSONALIZATION: benefit_en and benefit_tr must explain why this specific pose helps this specific user's condition and goals. If user notes are provided, reflect them in every benefit. " +
			"7. OUTPUT FORMAT: Respond ONLY with a valid JSON object. No conversational text, no markdown, no explanations.",
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
