package services

import (
	"context"
	"errors"
	"fmt"
	"time"

	"coffee-shop-backend/internal/models"
	"coffee-shop-backend/internal/repositories"
)

type OrderService struct {
	orderRepo   repositories.OrderRepository
	productRepo repositories.ProductRepository
}

func NewOrderService(orderRepo repositories.OrderRepository, productRepo repositories.ProductRepository) *OrderService {
	return &OrderService{
		orderRepo:   orderRepo,
		productRepo: productRepo,
	}
}

func (s *OrderService) CreateOrder(ctx context.Context, uid string, req *models.CreateOrderRequest) (*models.Order, error) {
	if err := req.Validate(); err != nil {
		return nil, err
	}

	var orderItems []models.OrderItem
	var totalSatang int64 = 0
	var totalQuantity int = 0

	// Re-query each product directly from the database to ensure zero trust of client pricing
	for _, item := range req.Items {
		product, err := s.productRepo.GetByID(ctx, item.ProductID)
		if err != nil {
			return nil, fmt.Errorf("item with product ID '%s' was not found", item.ProductID)
		}

		if !product.IsActive {
			return nil, fmt.Errorf("menu item '%s' is currently unavailable / inactive", product.Name)
		}

		subtotal := product.PriceSatang * int64(item.Quantity)
		totalSatang += subtotal
		totalQuantity += item.Quantity

		orderItems = append(orderItems, models.OrderItem{
			ProductID:       product.ID,
			ProductName:     product.Name,
			Quantity:        item.Quantity,
			UnitPriceSatang: product.PriceSatang,
			SubtotalSatang:  subtotal,
		})
	}

	order := &models.Order{
		Items:         orderItems,
		TotalSatang:   totalSatang,
		TotalQuantity: totalQuantity,
		CreatedBy:     uid,
		CreatedAt:     time.Now().UTC(),
	}

	if err := s.orderRepo.Create(ctx, order); err != nil {
		return nil, fmt.Errorf("failed to save order: %w", err)
	}

	return order, nil
}

func (s *OrderService) ListOrders(ctx context.Context, startDate, endDate string, limit, offset int) (*models.PaginatedOrdersResponse, error) {
	if limit <= 0 {
		limit = 20
	}
	if offset < 0 {
		offset = 0
	}

	orders, total, err := s.orderRepo.List(ctx, startDate, endDate, limit, offset)
	if err != nil {
		return nil, err
	}

	return &models.PaginatedOrdersResponse{
		Orders: orders,
		Total:  total,
		Limit:  limit,
		Offset: offset,
	}, nil
}

func (s *OrderService) GetOrderByID(ctx context.Context, id string) (*models.Order, error) {
	if id == "" {
		return nil, errors.New("order ID is required")
	}
	return s.orderRepo.GetByID(ctx, id)
}

