package services_test

import (
	"context"
	"testing"
	"time"

	"coffee-shop-backend/internal/models"
	mockRepo "coffee-shop-backend/internal/repositories/mock"
	"coffee-shop-backend/internal/services"
)

func TestDashboardService_GetSummary(t *testing.T) {
	ctx := context.Background()
	oRepo := mockRepo.NewMockOrderRepository()
	svc := services.NewDashboardService(oRepo)

	loc, err := time.LoadLocation("Asia/Bangkok")
	if err != nil {
		loc = time.FixedZone("Asia/Bangkok", 7*3600)
	}

	now := time.Now().In(loc)

	// Order today
	order1 := &models.Order{
		ID: "ord-test-1",
		Items: []models.OrderItem{
			{ProductID: "prod-1", ProductName: "Espresso", Quantity: 2, UnitPriceSatang: 5500, SubtotalSatang: 11000},
			{ProductID: "prod-2", ProductName: "Americano", Quantity: 1, UnitPriceSatang: 6500, SubtotalSatang: 6500},
		},
		TotalSatang:   17500,
		TotalQuantity: 3,
		CreatedBy:     "owner-1",
		CreatedAt:     now.UTC(),
	}
	_ = oRepo.Create(ctx, order1)

	// Order 2 days ago
	order2 := &models.Order{
		ID: "ord-test-2",
		Items: []models.OrderItem{
			{ProductID: "prod-1", ProductName: "Espresso", Quantity: 5, UnitPriceSatang: 5500, SubtotalSatang: 27500},
		},
		TotalSatang:   27500,
		TotalQuantity: 5,
		CreatedBy:     "owner-1",
		CreatedAt:     now.AddDate(0, 0, -2).UTC(),
	}
	_ = oRepo.Create(ctx, order2)

	summary, err := svc.GetSummary(ctx)
	if err != nil {
		t.Fatalf("unexpected error getting dashboard summary: %v", err)
	}

	// Today's stats should only include order1
	if summary.TodaySalesSatang != 17500 {
		t.Errorf("expected todaySalesSatang 17500, got: %d", summary.TodaySalesSatang)
	}
	if summary.TodayBillCount != 1 {
		t.Errorf("expected todayBillCount 1, got: %d", summary.TodayBillCount)
	}
	if summary.TodayItemsSold != 3 {
		t.Errorf("expected todayItemsSold 3, got: %d", summary.TodayItemsSold)
	}

	// Best seller across all orders: prod-1 Espresso with 2+5 = 7 items
	if summary.BestSeller == nil {
		t.Fatal("expected best seller, got nil")
	}
	if summary.BestSeller.ProductID != "prod-1" || summary.BestSeller.TotalQuantity != 7 {
		t.Errorf("expected best seller prod-1 with 7 sold, got: %+v", summary.BestSeller)
	}

	// 7 days array should have exactly 7 entries
	if len(summary.SalesLast7Days) != 7 {
		t.Errorf("expected 7 days of sales stats, got: %d", len(summary.SalesLast7Days))
	}
}

