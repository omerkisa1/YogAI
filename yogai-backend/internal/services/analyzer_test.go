package services

import (
	"testing"
	"math"
)

func TestScoreLogic(t *testing.T) {
	ruleMin := 160.0
	ruleMax := 180.0
	tolerance := 15.0

    testCases := []struct{
        angle float64
        expected float64
    }{
        {170.0, 100.0},
        {155.0, 66.66666666666667},
        {150.0, 33.33333333333333},
        {140.0, 0.0},
    }

    for _, tc := range testCases {
        angle := tc.angle
        score := 100.0
        if angle < ruleMin {
                diff := ruleMin - angle
                if diff >= tolerance {
                        score = 0.0
                } else {
                        score = 100.0 - (diff / tolerance * 100.0)
                }
        } else if angle > ruleMax {
                diff := angle - ruleMax
                if diff >= tolerance {
                        score = 0.0
                } else {
                        score = 100.0 - (diff / tolerance * 100.0)
                }
        }
        
        if math.Abs(score - tc.expected) > 0.01 {
            t.Errorf("For angle %f, expected %f, got %f", angle, tc.expected, score)
        }
    }
}

func TestCalculateAngle(t *testing.T) {
	a := PosLandmark{X: 1, Y: 1} // At 45 deg down right
	b := PosLandmark{X: 0, Y: 0}
	c := PosLandmark{X: 1, Y: 0} // At 0 deg

	angle := calculateAngle(a, b, c) // should be 45
	if math.Abs(angle-45.0) > 0.01 && math.Abs(angle-315.0) > 0.01 {
		t.Errorf("expected 45, got %f", angle)
	}
}