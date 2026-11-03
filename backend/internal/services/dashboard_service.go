package services

import (
	"context"
	"time"

	"coffee-shop-backend/internal/models"
	"coffee-shop-backend/internal/repositories"
)

type DashboardService struct {
	orderRepo repositories.OrderRepository
}

func NewDashboardService(orderRepo repositories.OrderRepository) *DashboardService {
	return &DashboardService{orderRepo: orderRepo}
}

func (s *DashboardService) GetSummary(ctx context.Context) (*models.DashboardSummary, error) {
	orders, err := s.orderRepo.GetAllForSummary(ctx)
	if err != nil {
		return nil, err
	}

	loc, err := time.LoadLocation("Asia/Bangkok")
	if err != nil {
		loc = time.FixedZone("Asia/Bangkok", 7*3600)
	}

	now := time.Now().In(loc)
	todayStr := now.Format("2006-01-02")

	var todaySalesSatang int64 = 0
	todayBillCount := 0
	todayItemsSold := 0

	// Aggregate last 7 days buckets
	type dayStat struct {
		totalSatang int64
		billCount   int
	}
	last7DaysMap := make(map[string]*dayStat)
	var last7DaysKeys []string

	for i := 6; i >= 0; i-- {
		dayKey := now.AddDate(0, 0, -i).Format("2006-01-02")
		last7DaysKeys = append(last7DaysKeys, dayKey)
		last7DaysMap[dayKey] = &dayStat{}
	}

	// Product sales tracker for best seller
	type prodAgg struct {
		name     string
		quantity int
		satang   int64
	}
	productSales := make(map[string]*prodAgg)

	for _, order := range orders {
		orderBangkokTime := order.CreatedAt.In(loc)
		orderDateStr := orderBangkokTime.Format("2006-01-02")

		// If today
		if orderDateStr == todayStr {
			todaySalesSatang += order.TotalSatang
			todayBillCount++
			todayItemsSold += order.TotalQuantity
		}

		// If within last 7 days
		if stat, exists := last7DaysMap[orderDateStr]; exists {
			stat.totalSatang += order.TotalSatang
			stat.billCount++
		}

		// Track best seller items
		for _, item := range order.Items {
			agg, exists := productSales[item.ProductID]
			if !exists {
				agg = &prodAgg{name: item.ProductName}
				productSales[item.ProductID] = agg
			}
			agg.quantity += item.Quantity
			agg.satang += item.SubtotalSatang
		}
	}

	// Determine best seller
	var bestSeller *models.BestSellerItem
	maxQuantity := 0
	for prodID, agg := range productSales {
		if agg.quantity > maxQuantity {
			maxQuantity = agg.quantity
			bestSeller = &models.BestSellerItem{
				ProductID:     prodID,
				ProductName:   agg.name,
				TotalQuantity: agg.quantity,
				TotalSatang:   agg.satang,
			}
		}
	}

	// Construct ordered 7 days list
	var salesLast7Days []models.DailySale
	for _, dayKey := range last7DaysKeys {
		stat := last7DaysMap[dayKey]
		salesLast7Days = append(salesLast7Days, models.DailySale{
			Date:        dayKey,
			TotalSatang: stat.totalSatang,
			BillCount:   stat.billCount,
		})
	}

	// Slice recent orders (max 10)
	recentLimit := 10
	if len(orders) < recentLimit {
		recentLimit = len(orders)
	}
	recentOrders := orders[:recentLimit]

	return &models.DashboardSummary{
		TodaySalesSatang: todaySalesSatang,
		TodayBillCount:   todayBillCount,
		TodayItemsSold:   todayItemsSold,
		BestSeller:       bestSeller,
		SalesLast7Days:   salesLast7Days,
		RecentOrders:     recentOrders,
	}, nil
}

