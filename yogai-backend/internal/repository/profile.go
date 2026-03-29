package repository

import (
	"context"
	"fmt"
	"time"

	"cloud.google.com/go/firestore"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type UserProfile struct {
	DisplayName       string    `json:"display_name" firestore:"display_name"`
	BirthYear         int       `json:"birth_year" firestore:"birth_year"`
	Gender            string    `json:"gender" firestore:"gender"`
	HeightCM          int       `json:"height_cm" firestore:"height_cm"`
	WeightKG          int       `json:"weight_kg" firestore:"weight_kg"`
	FitnessLevel      string    `json:"fitness_level" firestore:"fitness_level"`
	Injuries          []string  `json:"injuries" firestore:"injuries"`
	Goals             []string  `json:"goals" firestore:"goals"`
	PreferredDuration int       `json:"preferred_duration" firestore:"preferred_duration"`
	ProfileImageURL   string    `json:"profile_image_url" firestore:"profile_image_url"`
	Platform          string    `json:"platform" firestore:"platform"`
	LastLoginAt       string    `json:"last_login_at" firestore:"last_login_at"`
	AuthProvider      string    `json:"auth_provider" firestore:"auth_provider"`
	CreatedAt         time.Time `json:"created_at" firestore:"created_at"`
	UpdatedAt         time.Time `json:"updated_at" firestore:"updated_at"`
}

type ProfileRepository interface {
	GetProfile(ctx context.Context, uid string) (*UserProfile, error)
	SaveProfile(ctx context.Context, uid string, profile *UserProfile) error
}

type profileRepository struct {
	firestore *firestore.Client
}

func NewProfileRepository(firestoreClient *firestore.Client) ProfileRepository {
	return &profileRepository{firestore: firestoreClient}
}

func (r *profileRepository) profileDoc(uid string) *firestore.DocumentRef {
	return r.firestore.Collection("users").Doc(uid)
}

func (r *profileRepository) GetProfile(ctx context.Context, uid string) (*UserProfile, error) {
	doc, err := r.profileDoc(uid).Get(ctx)
	if err != nil {
		if status.Code(err) == codes.NotFound {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get profile: %w", err)
	}

	var profile UserProfile
	if err := doc.DataTo(&profile); err != nil {
		return nil, fmt.Errorf("failed to decode profile: %w", err)
	}

	return &profile, nil
}

func (r *profileRepository) SaveProfile(ctx context.Context, uid string, profile *UserProfile) error {
	existing, _ := r.GetProfile(ctx, uid)
	now := time.Now()
	profile.UpdatedAt = now
	if existing == nil {
		profile.CreatedAt = now
	} else {
		profile.CreatedAt = existing.CreatedAt
	}

	_, err := r.profileDoc(uid).Set(ctx, profile)
	if err != nil {
		return fmt.Errorf("failed to save profile: %w", err)
	}

	return nil
}
