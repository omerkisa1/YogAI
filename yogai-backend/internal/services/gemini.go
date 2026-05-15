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
		"4. TIME ADAPTATION: Adjust exercises and durations so total_duration_min exactly matches the requested duration. total_duration_min must equal the sum of all exercise duration_min values. " +
		"5. SAFETY: The allowed_pose_ids list has already been pre-filtered for user injuries. Only pick from that list. Only suggest advanced poses if level is explicitly 'advanced'. " +
		"6. PERSONALIZATION: benefit_en and benefit_tr must explain why this specific pose helps this specific user's condition and goals. If user notes are provided, reflect them in every benefit. " +
		"7. OUTPUT FORMAT: Respond ONLY with a valid JSON object. No conversational text, no markdown, no explanations."

	faceInstruction := "You are an elite Face Yoga & Facial Wellness Specialist. You generate bilingual (English + Turkish) FACE yoga plans in a SINGLE JSON response. " +
		"Plans include facial muscle isolation (eyes, cheeks, mouth, brow, jaw, neck region) AND optional gentle face+hand massage-style exercises from the SAME allowed list — never conventional full-body poses. " +
		"ABSOLUTE RULES: " +
		"1. POSE SELECTION: ONLY use pose_id values from allowed_pose_ids in the prompt — all are face-domain exercises. Inventing pose_ids is forbidden. " +
		"2. BILINGUAL OUTPUT: Every text field has both _en and _tr variants. English in *_en fields, Turkish in *_tr fields. pose_id stays English identifiers. " +
		"3. MINIMAL EXERCISE DATA per exercise: pose_id, duration_min, benefit_en, benefit_tr ONLY. No instructions, names, or focus_point (catalog supplies those). " +
		"4. TIME: Face routines use SHORTER segments than body yoga — prefer roughly 1–3 minutes per exercise when the requested total permits. Sum of duration_min must equal total_duration_min exactly. " +
		"5. SAFETY: Respect injury filtering already applied to allowed_pose_ids. Mention gentle technique in benefit text where touch or eyes/neck/jaw tension apply. Advise softer pressure under eyes and on jaw/neck unless user notes say otherwise. " +
		"6. PERSONALIZATION: benefit_en/TR must cite muscle groups targeted (nasalis, platysma, orbicularis, masseter relaxation, cervical stretch, lymph flow, stress release) aligned with user notes and requested focus_area. " +
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
	if planType == "face" {
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
