package models

import (
	"errors"
	"strings"
	"time"
)

// Allowed product categories
var ValidCategories = map[string]bool{
	"Coffee":       true,
	"Tea":          true,
	"Other Drinks": true,
	"Bakery":       true,
}

// User represents a store user (Owner) in users/{uid}
type User struct {
	UID         string    `json:"uid" firestore:"uid"`
	Email       string    `json:"email" firestore:"email"`
	DisplayName string    `json:"displayName" firestore:"displayName"`
	PhotoURL    string    `json:"photoURL" firestore:"photoURL"`
	CreatedAt   time.Time `json:"createdAt" firestore:"createdAt"`
	LastLoginAt time.Time `json:"lastLoginAt" firestore:"lastLoginAt"`
}

// Product represents a coffee shop menu item in products/{productId}
type Product struct {
	ID          string    `json:"id" firestore:"-"`
	Name        string    `json:"name" firestore:"name"`
	Category    string    `json:"category" firestore:"category"`
	PriceSatang int64     `json:"priceSatang" firestore:"priceSatang"` // Integer in Satang (1 Baht = 100 Satang)
	IsActive    bool      `json:"isActive" firestore:"isActive"`
	CreatedAt   time.Time `json:"createdAt" firestore:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt" firestore:"updatedAt"`
}

// OrderItem represents a line item in an order
type OrderItem struct {
	ProductID       string `json:"productId" firestore:"productId"`
	ProductName     string `json:"productName" firestore:"productName"`
	Quantity        int    `json:"quantity" firestore:"quantity"`
	UnitPriceSatang int64  `json:"unitPriceSatang" firestore:"unitPriceSatang"`
	SubtotalSatang  int64  `json:"subtotalSatang" firestore:"subtotalSatang"`
}

// Order represents a sales record in orders/{orderId}
type Order struct {
	ID            string      `json:"id" firestore:"-"`
	Items         []OrderItem `json:"items" firestore:"items"`
	TotalSatang   int64       `json:"totalSatang" firestore:"totalSatang"`
	TotalQuantity int         `json:"totalQuantity" firestore:"totalQuantity"`
	CreatedBy     string      `json:"createdBy" firestore:"createdBy"` // Firebase UID
	CreatedAt     time.Time   `json:"createdAt" firestore:"createdAt"`
}

// DTOs

type CreateProductRequest struct {
	Name        string `json:"name" binding:"required"`
	Category    string `json:"category" binding:"required"`
	PriceSatang int64  `json:"priceSatang"` // Can be 0 or positive
}

func (r *CreateProductRequest) Validate() error {
	trimmedName := strings.TrimSpace(r.Name)
	if trimmedName == "" {
		return errors.New("product name cannot be empty")
	}
	if !ValidCategories[r.Category] {
		return errors.New("invalid category: must be Coffee, Tea, Other Drinks, or Bakery")
	}
	if r.PriceSatang < 0 {
		return errors.New("price in satang cannot be negative")
	}
	return nil
}

type UpdateProductRequest struct {
	Name        string `json:"name" binding:"required"`
	Category    string `json:"category" binding:"required"`
	PriceSatang int64  `json:"priceSatang"`
}

func (r *UpdateProductRequest) Validate() error {
	trimmedName := strings.TrimSpace(r.Name)
	if trimmedName == "" {
		return errors.New("product name cannot be empty")
	}
	if !ValidCategories[r.Category] {
		return errors.New("invalid category: must be Coffee, Tea, Other Drinks, or Bakery")
	}
	if r.PriceSatang < 0 {
		return errors.New("price in satang cannot be negative")
	}
	return nil
}

type UpdateProductStatusRequest struct {
	IsActive *bool `json:"isActive" binding:"required"`
}

type CreateOrderItemRequest struct {
	ProductID string `json:"productId" binding:"required"`
	Quantity  int    `json:"quantity" binding:"required"`
}

type CreateOrderRequest struct {
	Items []CreateOrderItemRequest `json:"items" binding:"required"`
}

func (r *CreateOrderRequest) Validate() error {
	if len(r.Items) == 0 {
		return errors.New("order must contain at least one item")
	}
	seen := make(map[string]bool)
	for _, it := range r.Items {
		if strings.TrimSpace(it.ProductID) == "" {
			return errors.New("productId is required for all items")
		}
		if it.Quantity <= 0 {
			return errors.New("quantity must be a positive integer")
		}
		if seen[it.ProductID] {
			return errors.New("duplicate product in order; please combine quantities")
		}
		seen[it.ProductID] = true
	}
	return nil
}

// Dashboard and Analytics DTOs

type BestSellerItem struct {
	ProductID     string `json:"productId"`
	ProductName   string `json:"productName"`
	TotalQuantity int    `json:"totalQuantity"`
	TotalSatang   int64  `json:"totalSatang"`
}

type DailySale struct {
	Date        string `json:"date"` // e.g. "2026-11-03" (Asia/Bangkok)
	TotalSatang int64  `json:"totalSatang"`
	BillCount   int    `json:"billCount"`
}

type DashboardSummary struct {
	TodaySalesSatang int64           `json:"todaySalesSatang"`
	TodayBillCount   int             `json:"todayBillCount"`
	TodayItemsSold   int             `json:"todayItemsSold"`
	BestSeller       *BestSellerItem `json:"bestSeller"`
	SalesLast7Days   []DailySale     `json:"salesLast7Days"`
	RecentOrders     []Order         `json:"recentOrders"`
}

// Standard API response wrappers
type APIResponse struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Message string      `json:"message,omitempty"`
	Error   string      `json:"error,omitempty"`
}

type PaginatedOrdersResponse struct {
	Orders []Order `json:"orders"`
	Total  int     `json:"total"`
	Limit  int     `json:"limit"`
	Offset int     `json:"offset"`
}
