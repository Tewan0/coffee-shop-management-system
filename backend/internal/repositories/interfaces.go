package repositories

import (
	"context"
	"coffee-shop-backend/internal/models"
)

type ProductRepository interface {
	Create(ctx context.Context, p *models.Product) error
	GetByID(ctx context.Context, id string) (*models.Product, error)
	List(ctx context.Context, category string, search string, activeOnly bool) ([]models.Product, error)
	Update(ctx context.Context, p *models.Product) error
	SetStatus(ctx context.Context, id string, isActive bool) error
}

type OrderRepository interface {
	Create(ctx context.Context, o *models.Order) error
	GetByID(ctx context.Context, id string) (*models.Order, error)
	List(ctx context.Context, startDate, endDate string, limit, offset int) ([]models.Order, int, error)
	GetAllForSummary(ctx context.Context) ([]models.Order, error)
}

type UserRepository interface {
	Upsert(ctx context.Context, u *models.User) error
	GetByID(ctx context.Context, uid string) (*models.User, error)
}
