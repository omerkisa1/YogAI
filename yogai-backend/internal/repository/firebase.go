package repository

import (
	"context"
	"fmt"
	"time"

	"cloud.google.com/go/firestore"
	firebase "firebase.google.com/go/v4"
	"firebase.google.com/go/v4/auth"
	"google.golang.org/api/iterator"
	"google.golang.org/api/option"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type FirebaseApp struct {
	Auth      *auth.Client
	Firestore *firestore.Client
}

func NewFirebaseApp(ctx context.Context, credentialsFile string) (*FirebaseApp, error) {
	app, err := firebase.NewApp(ctx, nil, option.WithCredentialsFile(credentialsFile))
	if err != nil {
		return nil, fmt.Errorf("failed to initialize firebase app: %w", err)
	}

	authClient, err := app.Auth(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to initialize firebase auth: %w", err)
	}

	firestoreClient, err := app.Firestore(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to initialize firestore: %w", err)
	}

	return &FirebaseApp{
		Auth:      authClient,
		Firestore: firestoreClient,
	}, nil
}

func (f *FirebaseApp) Close() error {
	return f.Firestore.Close()
}

type YogaPlan struct {
	ID         string    `json:"id" firestore:"id"`
	Plan       string    `json:"plan" firestore:"plan"`
	Level      string    `json:"level" firestore:"level"`
	Duration   int       `json:"duration" firestore:"duration"`
	FocusArea  string    `json:"focus_area" firestore:"focus_area"`
	IsFavorite bool      `json:"is_favorite" firestore:"is_favorite"`
	IsPinned   bool      `json:"is_pinned" firestore:"is_pinned"`
	CreatedAt  time.Time `json:"created_at" firestore:"created_at"`
}

type YogaRepository interface {
	SavePlan(ctx context.Context, uid string, plan *YogaPlan) error
	GetPlans(ctx context.Context, uid string) ([]*YogaPlan, error)
	GetPlanByID(ctx context.Context, uid string, planID string) (*YogaPlan, error)
	UpdatePlanMeta(ctx context.Context, uid string, planID string, fields map[string]interface{}) error
	DeletePlan(ctx context.Context, uid string, planID string) error
}

type yogaRepository struct {
	firestore *firestore.Client
}

func NewYogaRepository(firestoreClient *firestore.Client) YogaRepository {
	return &yogaRepository{firestore: firestoreClient}
}

func (r *yogaRepository) plansCollection(uid string) *firestore.CollectionRef {
	return r.firestore.Collection("users").Doc(uid).Collection("plans")
}

func (r *yogaRepository) SavePlan(ctx context.Context, uid string, plan *YogaPlan) error {
	plan.CreatedAt = time.Now()

	ref := r.plansCollection(uid).NewDoc()
	plan.ID = ref.ID

	_, err := ref.Set(ctx, plan)
	if err != nil {
		return fmt.Errorf("failed to save plan: %w", err)
	}

	return nil
}

func (r *yogaRepository) GetPlans(ctx context.Context, uid string) ([]*YogaPlan, error) {
	iter := r.plansCollection(uid).
		OrderBy("created_at", firestore.Desc).
		Documents(ctx)
	defer iter.Stop()

	var plans []*YogaPlan
	for {
		doc, err := iter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			return nil, fmt.Errorf("failed to iterate plans: %w", err)
		}

		var plan YogaPlan
		if err := doc.DataTo(&plan); err != nil {
			return nil, fmt.Errorf("failed to decode plan: %w", err)
		}
		plans = append(plans, &plan)
	}

	return plans, nil
}

func (r *yogaRepository) GetPlanByID(ctx context.Context, uid string, planID string) (*YogaPlan, error) {
	doc, err := r.plansCollection(uid).Doc(planID).Get(ctx)
	if err != nil {
		if status.Code(err) == codes.NotFound {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get plan: %w", err)
	}

	var plan YogaPlan
	if err := doc.DataTo(&plan); err != nil {
		return nil, fmt.Errorf("failed to decode plan: %w", err)
	}

	return &plan, nil
}

func (r *yogaRepository) UpdatePlanMeta(ctx context.Context, uid string, planID string, fields map[string]interface{}) error {
	updates := make([]firestore.Update, 0, len(fields))
	for k, v := range fields {
		updates = append(updates, firestore.Update{Path: k, Value: v})
	}

	_, err := r.plansCollection(uid).Doc(planID).Update(ctx, updates)
	if err != nil {
		return fmt.Errorf("failed to update plan: %w", err)
	}

	return nil
}

func (r *yogaRepository) DeletePlan(ctx context.Context, uid string, planID string) error {
	_, err := r.plansCollection(uid).Doc(planID).Delete(ctx)
	if err != nil {
		return fmt.Errorf("failed to delete plan: %w", err)
	}

	return nil
}
