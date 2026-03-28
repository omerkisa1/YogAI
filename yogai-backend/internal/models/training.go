package models

import "time"

type TrainingSession struct {
	ID            string     `json:"id" firestore:"id"`
	PlanID        string     `json:"plan_id" firestore:"plan_id"`
	StartedAt     time.Time  `json:"started_at" firestore:"started_at"`
	CompletedAt   *time.Time `json:"completed_at,omitempty" firestore:"completed_at,omitempty"`
	Status        string     `json:"status" firestore:"status"`           // "active", "completed", "expired"
	TotalAccuracy float64    `json:"total_accuracy" firestore:"total_accuracy"`
	TotalDuration int        `json:"total_duration" firestore:"total_duration"` // seconds
	PoseCount     int        `json:"pose_count" firestore:"pose_count"`
}

type PoseResult struct {
	PoseID          string    `json:"pose_id" firestore:"pose_id"`
	Accuracy        float64   `json:"accuracy" firestore:"accuracy"`
	DurationSeconds int       `json:"duration_seconds" firestore:"duration_seconds"`
	CompletedAt     time.Time `json:"completed_at" firestore:"completed_at"`
}
