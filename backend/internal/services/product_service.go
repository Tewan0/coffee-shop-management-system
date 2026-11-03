package services

import (
	"context"
	"errors"

	"coffee-shop-backend/internal/models"
	"coffee-shop-backend/internal/repositories"
)

type ProductService struct {
	repo repositories.ProductRepository
}

func NewProductService(repo repositories.ProductRepository) *ProductService {
	return &ProductService{repo: repo}
}

func (s *ProductService) Create(ctx context.Context, req *models.CreateProductRequest) (*models.Product, error) {
	if err := req.Validate(); err != nil {
		return nil, err
	}

	p := &models.Product{
		Name:        req.Name,
		Category:    req.Category,
		PriceSatang: req.PriceSatang,
		IsActive:    true,
	}

	if err := s.repo.Create(ctx, p); err != nil {
		return nil, err
	}
	return p, nil
}

func (s *ProductService) GetByID(ctx context.Context, id string) (*models.Product, error) {
	if id == "" {
		return nil, errors.New("product id is required")
	}
	return s.repo.GetByID(ctx, id)
}

func (s *ProductService) List(ctx context.Context, category, search string, activeOnly bool) ([]models.Product, error) {
	return s.repo.List(ctx, category, search, activeOnly)
}

func (s *ProductService) Update(ctx context.Context, id string, req *models.UpdateProductRequest) (*models.Product, error) {
	if id == "" {
		return nil, errors.New("product id is required")
	}
	if err := req.Validate(); err != nil {
		return nil, err
	}

	existing, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	existing.Name = req.Name
	existing.Category = req.Category
	existing.PriceSatang = req.PriceSatang

	if err := s.repo.Update(ctx, existing); err != nil {
		return nil, err
	}
	return existing, nil
}

func (s *ProductService) SetStatus(ctx context.Context, id string, req *models.UpdateProductStatusRequest) error {
	if id == "" {
		return errors.New("product id is required")
	}
	if req.IsActive == nil {
		return errors.New("isActive boolean flag is required")
	}
	return s.repo.SetStatus(ctx, id, *req.IsActive)
}
