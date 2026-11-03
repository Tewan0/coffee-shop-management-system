package services_test

import (
	"context"
	"strings"
	"testing"

	"coffee-shop-backend/internal/models"
	mockRepo "coffee-shop-backend/internal/repositories/mock"
	"coffee-shop-backend/internal/services"
)

func TestOrderService_CreateOrder_ZeroTrustPricing(t *testing.T) {
	ctx := context.Background()
	pRepo := mockRepo.NewMockProductRepository()
	oRepo := mockRepo.NewMockOrderRepository()
	svc := services.NewOrderService(oRepo, pRepo)

	// In initial seed:
	// prod-1: Espresso, priceSatang: 5500 (55 THB)
	// prod-2: Americano, priceSatang: 6500 (65 THB)

	req := &models.CreateOrderRequest{
		Items: []models.CreateOrderItemRequest{
			{ProductID: "prod-1", Quantity: 2}, // 2 * 5500 = 11000
			{ProductID: "prod-2", Quantity: 1}, // 1 * 6500 = 6500
		},
	}

	order, err := svc.CreateOrder(ctx, "test-owner-uid", req)
	if err != nil {
		t.Fatalf("expected order creation to succeed, got error: %v", err)
	}

	expectedTotal := int64(17500) // 175 THB = 17500 satang
	if order.TotalSatang != expectedTotal {
		t.Errorf("expected totalSatang %d, got %d", expectedTotal, order.TotalSatang)
	}

	if order.TotalQuantity != 3 {
		t.Errorf("expected totalQuantity 3, got %d", order.TotalQuantity)
	}

	if len(order.Items) != 2 {
		t.Fatalf("expected 2 items, got %d", len(order.Items))
	}

	// Verify price snapshot in items
	if order.Items[0].UnitPriceSatang != 5500 || order.Items[0].SubtotalSatang != 11000 {
		t.Errorf("item 0 price mismatch: %+v", order.Items[0])
	}
	if order.Items[0].ProductName != "Espresso" {
		t.Errorf("item 0 name mismatch: %s", order.Items[0].ProductName)
	}
}

func TestOrderService_CreateOrder_InactiveProductRejected(t *testing.T) {
	ctx := context.Background()
	pRepo := mockRepo.NewMockProductRepository()
	oRepo := mockRepo.NewMockOrderRepository()
	svc := services.NewOrderService(oRepo, pRepo)

	// Deactivate prod-1
	_ = pRepo.SetStatus(ctx, "prod-1", false)

	req := &models.CreateOrderRequest{
		Items: []models.CreateOrderItemRequest{
			{ProductID: "prod-1", Quantity: 1},
		},
	}

	_, err := svc.CreateOrder(ctx, "test-owner-uid", req)
	if err == nil {
		t.Fatal("expected error ordering inactive product, got nil")
	}

	if !strings.Contains(err.Error(), "unavailable") && !strings.Contains(err.Error(), "inactive") {
		t.Errorf("expected error message mentioning unavailable/inactive, got: %v", err)
	}
}

func TestOrderService_CreateOrder_EmptyCartRejected(t *testing.T) {
	ctx := context.Background()
	pRepo := mockRepo.NewMockProductRepository()
	oRepo := mockRepo.NewMockOrderRepository()
	svc := services.NewOrderService(oRepo, pRepo)

	req := &models.CreateOrderRequest{
		Items: []models.CreateOrderItemRequest{},
	}

	_, err := svc.CreateOrder(ctx, "test-owner-uid", req)
	if err == nil {
		t.Fatal("expected error on empty order, got nil")
	}
}

func TestOrderService_CreateOrder_NegativeOrZeroQuantityRejected(t *testing.T) {
	ctx := context.Background()
	pRepo := mockRepo.NewMockProductRepository()
	oRepo := mockRepo.NewMockOrderRepository()
	svc := services.NewOrderService(oRepo, pRepo)

	req := &models.CreateOrderRequest{
		Items: []models.CreateOrderItemRequest{
			{ProductID: "prod-1", Quantity: 0},
		},
	}

	_, err := svc.CreateOrder(ctx, "test-owner-uid", req)
	if err == nil {
		t.Fatal("expected error on zero quantity, got nil")
	}

	req2 := &models.CreateOrderRequest{
		Items: []models.CreateOrderItemRequest{
			{ProductID: "prod-1", Quantity: -3},
		},
	}

	_, err2 := svc.CreateOrder(ctx, "test-owner-uid", req2)
	if err2 == nil {
		t.Fatal("expected error on negative quantity, got nil")
	}
}
