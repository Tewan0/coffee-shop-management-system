package mock

import (
	"context"
	"errors"
	"fmt"
	"sort"
	"strings"
	"sync"
	"time"

	"coffee-shop-backend/internal/models"
	"coffee-shop-backend/internal/repositories"
)

// ================= MOCK PRODUCT REPOSITORY =================

type MockProductRepository struct {
	mu       sync.RWMutex
	products map[string]*models.Product
	counter  int
}

func NewMockProductRepository() *MockProductRepository {
	repo := &MockProductRepository{
		products: make(map[string]*models.Product),
	}
	repo.seedInitialData()
	return repo
}

func (m *MockProductRepository) seedInitialData() {
	now := time.Now().UTC()
	initialProducts := []models.Product{
		{ID: "prod-1", Name: "Espresso", Category: "Coffee", PriceSatang: 5500, IsActive: true, CreatedAt: now, UpdatedAt: now},
		{ID: "prod-2", Name: "Americano (Iced)", Category: "Coffee", PriceSatang: 6500, IsActive: true, CreatedAt: now, UpdatedAt: now},
		{ID: "prod-3", Name: "Caffe Latte (Hot)", Category: "Coffee", PriceSatang: 7000, IsActive: true, CreatedAt: now, UpdatedAt: now},
		{ID: "prod-4", Name: "Caramel Macchiato", Category: "Coffee", PriceSatang: 8500, IsActive: true, CreatedAt: now, UpdatedAt: now},
		{ID: "prod-5", Name: "Thai Tea (Iced)", Category: "Tea", PriceSatang: 6000, IsActive: true, CreatedAt: now, UpdatedAt: now},
		{ID: "prod-6", Name: "Matcha Green Tea Latte", Category: "Tea", PriceSatang: 8000, IsActive: true, CreatedAt: now, UpdatedAt: now},
		{ID: "prod-7", Name: "Peach Iced Tea", Category: "Tea", PriceSatang: 6500, IsActive: true, CreatedAt: now, UpdatedAt: now},
		{ID: "prod-8", Name: "Dark Chocolate Frappe", Category: "Other Drinks", PriceSatang: 8500, IsActive: true, CreatedAt: now, UpdatedAt: now},
		{ID: "prod-9", Name: "Fresh Lemonade Soda", Category: "Other Drinks", PriceSatang: 6000, IsActive: true, CreatedAt: now, UpdatedAt: now},
		{ID: "prod-10", Name: "Butter Croissant", Category: "Bakery", PriceSatang: 6500, IsActive: true, CreatedAt: now, UpdatedAt: now},
		{ID: "prod-11", Name: "Almond Croissant", Category: "Bakery", PriceSatang: 8500, IsActive: true, CreatedAt: now, UpdatedAt: now},
		{ID: "prod-12", Name: "Chocolate Fudge Cake", Category: "Bakery", PriceSatang: 9500, IsActive: true, CreatedAt: now, UpdatedAt: now},
	}
	for i := range initialProducts {
		p := initialProducts[i]
		m.products[p.ID] = &p
	}
}

var _ repositories.ProductRepository = (*MockProductRepository)(nil)

func (m *MockProductRepository) Create(ctx context.Context, p *models.Product) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	m.counter++
	p.ID = fmt.Sprintf("prod-%d", time.Now().UnixNano())
	now := time.Now().UTC()
	p.CreatedAt = now
	p.UpdatedAt = now
	p.IsActive = true

	m.products[p.ID] = p
	return nil
}

func (m *MockProductRepository) GetByID(ctx context.Context, id string) (*models.Product, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	p, exists := m.products[id]
	if !exists {
		return nil, errors.New("product not found")
	}
	copy := *p
	return &copy, nil
}

func (m *MockProductRepository) List(ctx context.Context, category string, search string, activeOnly bool) ([]models.Product, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	var result []models.Product
	searchLower := strings.ToLower(strings.TrimSpace(search))

	for _, p := range m.products {
		if activeOnly && !p.IsActive {
			continue
		}
		if category != "" && p.Category != category {
			continue
		}
		if searchLower != "" && !strings.Contains(strings.ToLower(p.Name), searchLower) {
			continue
		}
		result = append(result, *p)
	}

	sort.Slice(result, func(i, j int) bool {
		return result[i].CreatedAt.After(result[j].CreatedAt)
	})

	return result, nil
}

func (m *MockProductRepository) Update(ctx context.Context, p *models.Product) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	existing, exists := m.products[p.ID]
	if !exists {
		return errors.New("product not found")
	}

	existing.Name = p.Name
	existing.Category = p.Category
	existing.PriceSatang = p.PriceSatang
	existing.UpdatedAt = time.Now().UTC()
	return nil
}

func (m *MockProductRepository) SetStatus(ctx context.Context, id string, isActive bool) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	existing, exists := m.products[id]
	if !exists {
		return errors.New("product not found")
	}

	existing.IsActive = isActive
	existing.UpdatedAt = time.Now().UTC()
	return nil
}

// ================= MOCK ORDER REPOSITORY =================

type MockOrderRepository struct {
	mu     sync.RWMutex
	orders map[string]*models.Order
}

func NewMockOrderRepository() *MockOrderRepository {
	return &MockOrderRepository{
		orders: make(map[string]*models.Order),
	}
}

var _ repositories.OrderRepository = (*MockOrderRepository)(nil)

func (m *MockOrderRepository) Create(ctx context.Context, o *models.Order) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	if o.ID == "" {
		o.ID = fmt.Sprintf("ord-%d", time.Now().UnixNano())
	}
	if o.CreatedAt.IsZero() {
		o.CreatedAt = time.Now().UTC()
	}

	m.orders[o.ID] = o
	return nil
}

func (m *MockOrderRepository) GetByID(ctx context.Context, id string) (*models.Order, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	o, exists := m.orders[id]
	if !exists {
		return nil, errors.New("order not found")
	}
	copy := *o
	return &copy, nil
}

func (m *MockOrderRepository) List(ctx context.Context, startDate, endDate string, limit, offset int) ([]models.Order, int, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	loc, err := time.LoadLocation("Asia/Bangkok")
	if err != nil {
		loc = time.FixedZone("Asia/Bangkok", 7*3600)
	}

	var filtered []models.Order
	var tStart, tEnd time.Time
	hasStart := false
	hasEnd := false

	if startDate != "" {
		if t, err := time.ParseInLocation("2006-01-02", startDate, loc); err == nil {
			tStart = t.UTC()
			hasStart = true
		}
	}
	if endDate != "" {
		if t, err := time.ParseInLocation("2006-01-02", endDate, loc); err == nil {
			tEnd = t.Add(24*time.Hour - time.Nanosecond).UTC()
			hasEnd = true
		}
	}

	for _, o := range m.orders {
		if hasStart && o.CreatedAt.Before(tStart) {
			continue
		}
		if hasEnd && o.CreatedAt.After(tEnd) {
			continue
		}
		filtered = append(filtered, *o)
	}

	sort.Slice(filtered, func(i, j int) bool {
		return filtered[i].CreatedAt.After(filtered[j].CreatedAt)
	})

	total := len(filtered)
	if offset >= total {
		return []models.Order{}, total, nil
	}

	endIdx := offset + limit
	if limit <= 0 || endIdx > total {
		endIdx = total
	}

	return filtered[offset:endIdx], total, nil
}

func (m *MockOrderRepository) GetAllForSummary(ctx context.Context) ([]models.Order, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	var result []models.Order
	for _, o := range m.orders {
		result = append(result, *o)
	}
	sort.Slice(result, func(i, j int) bool {
		return result[i].CreatedAt.After(result[j].CreatedAt)
	})
	return result, nil
}

// ================= MOCK USER REPOSITORY =================

type MockUserRepository struct {
	mu    sync.RWMutex
	users map[string]*models.User
}

func NewMockUserRepository() *MockUserRepository {
	return &MockUserRepository{
		users: make(map[string]*models.User),
	}
}

var _ repositories.UserRepository = (*MockUserRepository)(nil)

func (m *MockUserRepository) Upsert(ctx context.Context, u *models.User) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	now := time.Now().UTC()
	u.LastLoginAt = now
	if u.CreatedAt.IsZero() {
		u.CreatedAt = now
	}
	m.users[u.UID] = u
	return nil
}

func (m *MockUserRepository) GetByID(ctx context.Context, uid string) (*models.User, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	u, exists := m.users[uid]
	if !exists {
		return nil, errors.New("user not found")
	}
	copy := *u
	return &copy, nil
}
