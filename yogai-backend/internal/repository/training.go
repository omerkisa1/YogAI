package repository

import (
	"context"
	"fmt"

	"cloud.google.com/go/firestore"
	"github.com/omerkisa/yogai-backend/internal/models"
	"google.golang.org/api/iterator"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type TrainingRepository interface {
	CreateSession(ctx context.Context, uid string, session *models.TrainingSession) error
	GetSessionByID(ctx context.Context, uid string, sessionID string) (*models.TrainingSession, error)
	GetActiveSession(ctx context.Context, uid string) (*models.TrainingSession, error)
	UpdateSession(ctx context.Context, uid string, sessionID string, fields map[string]interface{}) error
	SavePoseResult(ctx context.Context, uid string, sessionID string, result *models.PoseResult) error
	GetPoseResults(ctx context.Context, uid string, sessionID string) ([]*models.PoseResult, error)
	GetSessions(ctx context.Context, uid string) ([]*models.TrainingSession, error)
}

type trainingRepository struct {
	firestore *firestore.Client
}

func NewTrainingRepository(firestoreClient *firestore.Client) TrainingRepository {
	return &trainingRepository{firestore: firestoreClient}
}

func (r *trainingRepository) sessionsColl(uid string) *firestore.CollectionRef {
	return r.firestore.Collection("users").Doc(uid).Collection("sessions")
}

func (r *trainingRepository) CreateSession(ctx context.Context, uid string, session *models.TrainingSession) error {
	ref := r.sessionsColl(uid).NewDoc()
	session.ID = ref.ID

	_, err := ref.Set(ctx, session)
	if err != nil {
		return fmt.Errorf("failed to create session: %w", err)
	}
	return nil
}

func (r *trainingRepository) GetSessionByID(ctx context.Context, uid string, sessionID string) (*models.TrainingSession, error) {
	doc, err := r.sessionsColl(uid).Doc(sessionID).Get(ctx)
	if err != nil {
		if status.Code(err) == codes.NotFound {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get session: %w", err)
	}

	var s models.TrainingSession
	if err := doc.DataTo(&s); err != nil {
		return nil, fmt.Errorf("failed to decode session: %w", err)
	}
	return &s, nil
}

func (r *trainingRepository) GetActiveSession(ctx context.Context, uid string) (*models.TrainingSession, error) {
	iter := r.sessionsColl(uid).Where("status", "==", "active").Limit(1).Documents(ctx)
	defer iter.Stop()
	doc, err := iter.Next()
	if err == iterator.Done {
		return nil, nil // No active session
	}
	if err != nil {
		return nil, fmt.Errorf("failed to query active session: %w", err)
	}

	var s models.TrainingSession
	if err := doc.DataTo(&s); err != nil {
		return nil, fmt.Errorf("failed to decode active session: %w", err)
	}
	return &s, nil
}

func (r *trainingRepository) UpdateSession(ctx context.Context, uid string, sessionID string, fields map[string]interface{}) error {
	updates := make([]firestore.Update, 0, len(fields))
	for k, v := range fields {
		updates = append(updates, firestore.Update{Path: k, Value: v})
	}

	_, err := r.sessionsColl(uid).Doc(sessionID).Update(ctx, updates)
	if err != nil {
		return fmt.Errorf("failed to update session: %w", err)
	}
	return nil
}

func (r *trainingRepository) SavePoseResult(ctx context.Context, uid string, sessionID string, result *models.PoseResult) error {
	ref := r.sessionsColl(uid).Doc(sessionID).Collection("results").NewDoc()
	_, err := ref.Set(ctx, result)
	if err != nil {
		return fmt.Errorf("failed to save pose result: %w", err)
	}
	return nil
}

func (r *trainingRepository) GetPoseResults(ctx context.Context, uid string, sessionID string) ([]*models.PoseResult, error) {
	iter := r.sessionsColl(uid).Doc(sessionID).Collection("results").OrderBy("completed_at", firestore.Asc).Documents(ctx)
	defer iter.Stop()

	var results []*models.PoseResult
	for {
		doc, err := iter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			return nil, fmt.Errorf("failed to iterate results: %w", err)
		}
		var pr models.PoseResult
		if err := doc.DataTo(&pr); err != nil {
			return nil, fmt.Errorf("failed to decode result: %w", err)
		}
		results = append(results, &pr)
	}
	return results, nil
}

func (r *trainingRepository) GetSessions(ctx context.Context, uid string) ([]*models.TrainingSession, error) {
	iter := r.sessionsColl(uid).OrderBy("started_at", firestore.Desc).Documents(ctx)
	defer iter.Stop()

	var sessions []*models.TrainingSession
	for {
		doc, err := iter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			return nil, fmt.Errorf("failed to iterate sessions: %w", err)
		}
		var s models.TrainingSession
		if err := doc.DataTo(&s); err != nil {
			return nil, fmt.Errorf("failed to decode session: %w", err)
		}
		sessions = append(sessions, &s)
	}
	return sessions, nil
}