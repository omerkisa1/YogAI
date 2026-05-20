package services

import (
	"context"
	"fmt"
	"time"

	"github.com/google/generative-ai-go/genai"
	"google.golang.org/api/option"
)

const (
	geminiTimeout  = 30 * time.Second
	maxRetries     = 3
	baseRetryDelay = 1 * time.Second
)

type LLMExercise struct {
	PoseID    string `json:"pose_id"`
	Duration  int    `json:"duration_min"`
	RepTarget int    `json:"rep_target"`
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
	GenerateYogaPlan(ctx context.Context, prompt string, planType string) (string, error)
	AnalyzePose(ctx context.Context, prompt string) (string, error)
	Close() error
}

type geminiService struct {
	client    *genai.Client
	bodyModel *genai.GenerativeModel
	faceModel *genai.GenerativeModel
}

func newPlanModel(client *genai.Client, systemInstruction string) *genai.GenerativeModel {
	m := client.GenerativeModel("gemini-2.5-flash")
	m.SetTemperature(0.7)
	m.ResponseMIMEType = "application/json"
	m.SystemInstruction = genai.NewUserContent(genai.Text(systemInstruction))
	return m
}

func NewGeminiService(apiKey string) (AIService, error) {
	ctx := context.Background()

	client, err := genai.NewClient(ctx, option.WithAPIKey(apiKey))
	if err != nil {
		return nil, fmt.Errorf("failed to create gemini client: %w", err)
	}

	bodyInstruction := "You are an elite Yoga & Wellness Architect. You generate bilingual (English + Turkish) BODY yoga plans in a SINGLE JSON response. " +
		"ABSOLUTE RULES: " +
		"1. POSE SELECTION: You may ONLY use pose_id values from the allowed_pose_ids list provided in the prompt. You MUST NOT invent or fabricate any pose_id. " +
		"2. BILINGUAL OUTPUT: Every text field has both _en and _tr variants. Write English text in _en fields and Turkish text in _tr fields. pose_id values are always English identifiers. " +
		"3. MINIMAL EXERCISE DATA: For each exercise, return ONLY pose_id, duration_min, benefit_en, and benefit_tr. Do NOT include instructions, name, or focus_point — those are provided by our catalog. " +
		"4. TIME ADAPTATION: Adjust exercises and durations so total_duration_min is as close as possible to the requested duration (±2 minutes). total_duration_min must equal the sum of all exercise duration_min values. " +
		"5. DURATION RULES: Each exercise duration_min must be between 1 and 8 minutes. Short workouts (5-15 min): 3-5 poses, 2-4 min each. Medium (15-30 min): 5-8 poses, 2-5 min each. Long (30-60 min): 8-15 poses, 3-6 min each. Very long (60+ min): 15-20 poses, 3-8 min each. Beginner: shorter holds (2-3 min). Intermediate: 3-4 min. Advanced: longer holds (4-6 min), fewer poses but denser. Start with warm-up poses, end with relaxation (e.g. corpse). Same pose_id at most twice. " +
		"6. SAFETY: The allowed_pose_ids list has already been pre-filtered for user injuries. Only pick from that list. Only suggest advanced poses if level is explicitly 'advanced'. " +
		"7. PERSONALIZATION: benefit_en and benefit_tr must explain why this specific pose helps this specific user's condition and goals. If user notes are provided, reflect them in every benefit. " +
		"8. OUTPUT FORMAT: Respond ONLY with a valid JSON object. No conversational text, no markdown, no explanations."

	faceInstruction := "You are an elite Face Yoga & Facial Wellness Specialist. You generate bilingual (English + Turkish) FACE yoga plans in a SINGLE JSON response. " +
		"Plans may combine facial muscle isolation (face_* poses) and gentle hand-guided massage (face_hand_* poses) from the same allowed list — never conventional full-body poses. " +
		"ABSOLUTE RULES: " +
		"1. POSE SELECTION: ONLY use pose_id values from allowed_pose_ids in the prompt — all are face-domain exercises. Inventing pose_ids is forbidden. " +
		"2. BILINGUAL OUTPUT: Every text field has both _en and _tr variants. English in *_en fields, Turkish in *_tr fields. pose_id stays English identifiers. " +
		"3. MINIMAL EXERCISE DATA per exercise: pose_id, duration_min (estimated minutes for scheduling), rep_target (repetition count), benefit_en, benefit_tr. No instructions or names. " +
		"4. TIME AND REP RULES: Match total estimated time to requested duration. Each exercise estimated time ≈ (rep_target × 3 seconds) + 10 seconds rest. Short face yoga (5-10 min): 5-8 poses, 8-12 reps. Medium (10-20 min): 8-12 poses, 10-15 reps. Long (20+ min): 12-18 poses, 12-20 reps. Beginner: fewer reps (8-10). Intermediate: 10-15. Advanced: 15-20. face_hand poses: fewer reps (5-8). Warm up with easy face moves, finish with relaxation. " +
		"5. SAFETY: Respect injury filtering already applied to allowed_pose_ids. Gentle technique for eyes/neck/jaw; light pressure for hand-touch poses. " +
		"6. PERSONALIZATION: benefit_en/TR must cite targeted muscle groups and regions aligned with user notes and focus_area. " +
		"7. OUTPUT FORMAT: Valid JSON object only — no prose, markdown, or commentary."

	bodyModel := newPlanModel(client, bodyInstruction)
	faceModel := newPlanModel(client, faceInstruction)

	return &geminiService{
		client:    client,
		bodyModel: bodyModel,
		faceModel: faceModel,
	}, nil
}

func (s *geminiService) GenerateYogaPlan(ctx context.Context, prompt string, planType string) (string, error) {
	model := s.bodyModel
	if planType == "face" || planType == "face_hand" {
		model = s.faceModel
	}
	var lastErr error
	for attempt := 0; attempt < maxRetries; attempt++ {
		if attempt > 0 {
			delay := baseRetryDelay * time.Duration(1<<uint(attempt-1))
			time.Sleep(delay)
		}

		timeoutCtx, cancel := context.WithTimeout(ctx, geminiTimeout)
		resp, err := model.GenerateContent(timeoutCtx, genai.Text(prompt))
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
		resp, err := s.bodyModel.GenerateContent(timeoutCtx, genai.Text(prompt))
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
