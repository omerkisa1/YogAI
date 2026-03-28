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
	RuleType      string    `json:"rule_type,omitempty"`
	Score         float64   `json:"score,omitempty"`
	Penalty       float64   `json:"penalty,omitempty"`
	Triggered     bool      `json:"triggered,omitempty"`
	Status        string    `json:"status"`
	FeedbackEN    string    `json:"feedback_en,omitempty"`
	FeedbackTR    string    `json:"feedback_tr,omitempty"`
}

type AnalyzeResponse struct {
	PoseID          string       `json:"pose_id"`
	OverallAccuracy float64      `json:"overall_accuracy"`
	TargetScore     float64      `json:"target_score"`
	FaultPenalty    float64      `json:"fault_penalty"`
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
	targetScoreSum := 0.0
	targetWeightTotal := 0.0
	faultPenaltySum := 0.0

	var globalFeedbackEN, globalFeedbackTR string

	for _, rule := range rules {
		a, okA := landmarksMap[rule.PointA]
		b, okB := landmarksMap[rule.PointB]
		c, okC := landmarksMap[rule.PointC]

		if !okA || !okB || !okC || a.Visibility < 0.5 || b.Visibility < 0.5 || c.Visibility < 0.5 {
			continue
		}

		angle := calculateAngle(a, b, c)

		ruleType := rule.RuleType
		if ruleType == "" {
			ruleType = "target"
		}

		if ruleType == "target" {
			score := 100.0
			diff := 0.0
			if angle < rule.AngleMin {
				diff = rule.AngleMin - angle
			} else if angle > rule.AngleMax {
				diff = angle - rule.AngleMax
			}

			if diff > 0 {
				if diff > 15.0 {
					score = 0.0
				} else {
					score = 100.0 - (diff / 15.0 * 100.0)
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
				RuleType:      "target",
				ExpectedRange: []float64{rule.AngleMin, rule.AngleMax},
				ActualAngle:   angle,
				Score:         score,
				Status:        status,
				FeedbackEN:    fEN,
				FeedbackTR:    fTR,
			})

			targetScoreSum += score * rule.Weight
			targetWeightTotal += rule.Weight

		} else if ruleType == "fault" {
			isTriggered := false
			diff := 0.0

			if angle < rule.AngleMin {
				diff = rule.AngleMin - angle
			} else if angle > rule.AngleMax {
				diff = angle - rule.AngleMax
			}

			if diff == 0 {
				isTriggered = true
			}

			status := "good"
			penalty := 0.0
			fEN := ""
			fTR := ""

			if isTriggered {
				penalty = rule.Weight * 100.0
				status = "fault_detected"
				fEN = rule.FeedbackEN
				fTR = rule.FeedbackTR
				if globalFeedbackEN == "" {
					globalFeedbackEN = fEN
					globalFeedbackTR = fTR
				}
				faultPenaltySum += penalty
			}

			results = append(results, RuleResult{
				Joint:         rule.Joint,
				RuleType:      "fault",
				ExpectedRange: []float64{rule.AngleMin, rule.AngleMax},
				ActualAngle:   angle,
				Penalty:       penalty,
				Triggered:     isTriggered,
				Status:        status,
				FeedbackEN:    fEN,
				FeedbackTR:    fTR,
			})
		}
	}

	finalTargetScore := 0.0
	if targetWeightTotal > 0 {
		finalTargetScore = targetScoreSum / targetWeightTotal
	} else {
		finalTargetScore = 100.0 // no target rules
	}

	overallAcc := finalTargetScore - faultPenaltySum
	if overallAcc < 0 {
		overallAcc = 0
	}

	return &AnalyzeResponse{
		PoseID:          req.PoseID,
		OverallAccuracy: overallAcc,
		TargetScore:     finalTargetScore,
		FaultPenalty:    faultPenaltySum,
		Rules:           results,
		FeedbackEN:      globalFeedbackEN,
		FeedbackTR:      globalFeedbackTR,
	}, nil
}
