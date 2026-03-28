package services

import (
	"fmt"
	"math"

	"github.com/omerkisa/yogai-backend/internal/catalog"
)

type PosLandmark struct {
	Index      int     `json:"index"`
	X          float64 `json:"x"`
	Y          float64 `json:"y"`
	Z          float64 `json:"z"`
	Visibility float64 `json:"visibility"`
}

type AnalyzeRequest struct {
	PoseID    string        `json:"pose_id"`
	Landmarks []PosLandmark `json:"landmarks"`
}

type RuleResult struct {
	Joint         string    `json:"joint"`
	ExpectedRange []float64 `json:"expected_range"`
	ActualAngle   float64   `json:"actual_angle"`
	Score         float64   `json:"score"`
	Status        string    `json:"status"`
	FeedbackEN    string    `json:"feedback_en,omitempty"`
	FeedbackTR    string    `json:"feedback_tr,omitempty"`
}

type AnalyzeResponse struct {
	PoseID          string       `json:"pose_id"`
	OverallAccuracy float64      `json:"overall_accuracy"`
	Rules           []RuleResult `json:"rules"`
	FeedbackEN      string       `json:"feedback_en,omitempty"`
	FeedbackTR      string       `json:"feedback_tr,omitempty"`
}

func calculateAngle(a, b, c PosLandmark) float64 {
	angle := math.Atan2(c.Y-b.Y, c.X-b.X) - math.Atan2(a.Y-b.Y, a.X-b.X)
	angle = angle * 180.0 / math.Pi
	if angle < 0 {
		angle += 360.0
	}
	if angle > 180.0 {
		angle = 360.0 - angle
	}
	return angle
}

func AnalyzePoseLandmarks(req AnalyzeRequest) (*AnalyzeResponse, error) {
	rules, ok := catalog.GetPoseRules(req.PoseID)
	if !ok {
		return nil, fmt.Errorf("pose %s is not analyzable or not found", req.PoseID)
	}

	landmarksMap := make(map[int]PosLandmark)
	for _, l := range req.Landmarks {
		landmarksMap[l.Index] = l
	}

	var results []RuleResult
	totalScore := 0.0
	totalWeight := 0.0

	var globalFeedbackEN, globalFeedbackTR string

	for _, rule := range rules {
		a, okA := landmarksMap[rule.PointA]
		b, okB := landmarksMap[rule.PointB]
		c, okC := landmarksMap[rule.PointC]

		if !okA || !okB || !okC || a.Visibility < 0.5 || b.Visibility < 0.5 || c.Visibility < 0.5 {
			continue
		}

		angle := calculateAngle(a, b, c)

		score := 100.0
		if angle < rule.AngleMin {
			diff := rule.AngleMin - angle
			if diff > 15 {
				score = 0
			} else {
				score = 100 - (diff / 15 * 100)
			}
		} else if angle > rule.AngleMax {
			diff := angle - rule.AngleMax
			if diff > 15 {
				score = 0
			} else {
				score = 100 - (diff / 15 * 100)
			}
		}

		status := "good"
		fEN := ""
		fTR := ""
		if score < 60 {
			status = "poor"
			fEN = rule.FeedbackEN
			fTR = rule.FeedbackTR
			if globalFeedbackEN == "" {
				globalFeedbackEN = fEN
				globalFeedbackTR = fTR
			}
		} else if score < 90 {
			status = "needs_improvement"
			fEN = rule.FeedbackEN
			fTR = rule.FeedbackTR
		}

		results = append(results, RuleResult{
			Joint:         rule.Joint,
			ExpectedRange: []float64{rule.AngleMin, rule.AngleMax},
			ActualAngle:   angle,
			Score:         score,
			Status:        status,
			FeedbackEN:    fEN,
			FeedbackTR:    fTR,
		})

		totalScore += score * rule.Weight
		totalWeight += rule.Weight
	}

	overallAcc := 0.0
	if totalWeight > 0 {
		overallAcc = totalScore / totalWeight
	}

	return &AnalyzeResponse{
		PoseID:          req.PoseID,
		OverallAccuracy: overallAcc,
		Rules:           results,
		FeedbackEN:      globalFeedbackEN,
		FeedbackTR:      globalFeedbackTR,
	}, nil
}
