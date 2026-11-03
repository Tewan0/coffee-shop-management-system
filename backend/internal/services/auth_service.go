package services

import (
	"context"
	"time"

	"coffee-shop-backend/internal/models"
	"coffee-shop-backend/internal/repositories"
)

type AuthService struct {
	userRepo repositories.UserRepository
}

func NewAuthService(userRepo repositories.UserRepository) *AuthService {
	return &AuthService{userRepo: userRepo}
}

func (s *AuthService) SyncUserProfile(ctx context.Context, uid, email, displayName, photoURL string) (*models.User, error) {
	now := time.Now().UTC()
	user := &models.User{
		UID:         uid,
		Email:       email,
		DisplayName: displayName,
		PhotoURL:    photoURL,
		LastLoginAt: now,
	}

	existing, err := s.userRepo.GetByID(ctx, uid)
	if err == nil && existing != nil {
		user.CreatedAt = existing.CreatedAt
	} else {
		user.CreatedAt = now
	}

	if err := s.userRepo.Upsert(ctx, user); err != nil {
		return nil, err
	}
	return user, nil
}
