package firestore

import (
	"context"
	"errors"
	"strings"
	"time"

	"cloud.google.com/go/firestore"
	"google.golang.org/api/iterator"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"

	"coffee-shop-backend/internal/models"
	"coffee-shop-backend/internal/repositories"
)

// ================= PRODUCT REPOSITORY =================

type ProductRepository struct {
	client *firestore.Client
}

func NewProductRepository(client *firestore.Client) *ProductRepository {
	return &ProductRepository{client: client}
}

var _ repositories.ProductRepository = (*ProductRepository)(nil)

func (r *ProductRepository) Create(ctx context.Context, p *models.Product) error {
	docRef := r.client.Collection("products").NewDoc()
	p.ID = docRef.ID
	now := time.Now().UTC()
	p.CreatedAt = now
	p.UpdatedAt = now
	p.IsActive = true

	_, err := docRef.Set(ctx, map[string]interface{}{
		"name":        p.Name,
		"category":    p.Category,
		"priceSatang": p.PriceSatang,
		"isActive":    p.IsActive,
		"createdAt":   p.CreatedAt,
		"updatedAt":   p.UpdatedAt,
	})
	return err
}

func (r *ProductRepository) GetByID(ctx context.Context, id string) (*models.Product, error) {
	docSnap, err := r.client.Collection("products").Doc(id).Get(ctx)
	if err != nil {
		if status.Code(err) == codes.NotFound {
			return nil, errors.New("product not found")
		}
		return nil, err
	}

	var p models.Product
	if err := docSnap.DataTo(&p); err != nil {
		return nil, err
	}
	p.ID = docSnap.Ref.ID
	return &p, nil
}

func (r *ProductRepository) List(ctx context.Context, category string, search string, activeOnly bool) ([]models.Product, error) {
	q := r.client.Collection("products").Query
	if activeOnly {
		q = q.Where("isActive", "==", true)
	}
	if category != "" {
		q = q.Where("category", "==", category)
	}

	iter := q.Documents(ctx)
	defer iter.Stop()

	var products []models.Product
	searchLower := strings.ToLower(strings.TrimSpace(search))

	for {
		doc, err := iter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			return nil, err
		}

		var p models.Product
		if err := doc.DataTo(&p); err != nil {
			continue
		}
		p.ID = doc.Ref.ID

		if searchLower != "" && !strings.Contains(strings.ToLower(p.Name), searchLower) {
			continue
		}

		products = append(products, p)
	}

	return products, nil
}

func (r *ProductRepository) Update(ctx context.Context, p *models.Product) error {
	docRef := r.client.Collection("products").Doc(p.ID)
	now := time.Now().UTC()
	p.UpdatedAt = now

	_, err := docRef.Update(ctx, []firestore.Update{
		{Path: "name", Value: p.Name},
		{Path: "category", Value: p.Category},
		{Path: "priceSatang", Value: p.PriceSatang},
		{Path: "updatedAt", Value: p.UpdatedAt},
	})
	return err
}

func (r *ProductRepository) SetStatus(ctx context.Context, id string, isActive bool) error {
	docRef := r.client.Collection("products").Doc(id)
	now := time.Now().UTC()

	_, err := docRef.Update(ctx, []firestore.Update{
		{Path: "isActive", Value: isActive},
		{Path: "updatedAt", Value: now},
	})
	return err
}

// ================= ORDER REPOSITORY =================

type OrderRepository struct {
	client *firestore.Client
}

func NewOrderRepository(client *firestore.Client) *OrderRepository {
	return &OrderRepository{client: client}
}

var _ repositories.OrderRepository = (*OrderRepository)(nil)

func (r *OrderRepository) Create(ctx context.Context, o *models.Order) error {
	docRef := r.client.Collection("orders").NewDoc()
	o.ID = docRef.ID
	if o.CreatedAt.IsZero() {
		o.CreatedAt = time.Now().UTC()
	}

	_, err := docRef.Set(ctx, map[string]interface{}{
		"items":         o.Items,
		"totalSatang":   o.TotalSatang,
		"totalQuantity": o.TotalQuantity,
		"createdBy":     o.CreatedBy,
		"createdAt":     o.CreatedAt,
	})
	return err
}

func (r *OrderRepository) GetByID(ctx context.Context, id string) (*models.Order, error) {
	docSnap, err := r.client.Collection("orders").Doc(id).Get(ctx)
	if err != nil {
		if status.Code(err) == codes.NotFound {
			return nil, errors.New("order not found")
		}
		return nil, err
	}

	var o models.Order
	if err := docSnap.DataTo(&o); err != nil {
		return nil, err
	}
	o.ID = docSnap.Ref.ID
	return &o, nil
}

func (r *OrderRepository) List(ctx context.Context, startDate, endDate string, limit, offset int) ([]models.Order, int, error) {
	q := r.client.Collection("orders").OrderBy("createdAt", firestore.Desc)

	loc, err := time.LoadLocation("Asia/Bangkok")
	if err != nil {
		loc = time.FixedZone("Asia/Bangkok", 7*3600)
	}

	if startDate != "" {
		if tStart, err := time.ParseInLocation("2006-01-02", startDate, loc); err == nil {
			q = q.Where("createdAt", ">=", tStart.UTC())
		}
	}
	if endDate != "" {
		if tEnd, err := time.ParseInLocation("2006-01-02", endDate, loc); err == nil {
			tEnd = tEnd.Add(24*time.Hour - time.Nanosecond)
			q = q.Where("createdAt", "<=", tEnd.UTC())
		}
	}

	iter := q.Documents(ctx)
	defer iter.Stop()

	var allOrders []models.Order
	for {
		doc, err := iter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			return nil, 0, err
		}

		var o models.Order
		if err := doc.DataTo(&o); err != nil {
			continue
		}
		o.ID = doc.Ref.ID
		allOrders = append(allOrders, o)
	}

	total := len(allOrders)
	if offset >= total {
		return []models.Order{}, total, nil
	}

	endIdx := offset + limit
	if limit <= 0 || endIdx > total {
		endIdx = total
	}

	return allOrders[offset:endIdx], total, nil
}

func (r *OrderRepository) GetAllForSummary(ctx context.Context) ([]models.Order, error) {
	iter := r.client.Collection("orders").OrderBy("createdAt", firestore.Desc).Documents(ctx)
	defer iter.Stop()

	var orders []models.Order
	for {
		doc, err := iter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			return nil, err
		}

		var o models.Order
		if err := doc.DataTo(&o); err != nil {
			continue
		}
		o.ID = doc.Ref.ID
		orders = append(orders, o)
	}
	return orders, nil
}

// ================= USER REPOSITORY =================

type UserRepository struct {
	client *firestore.Client
}

func NewUserRepository(client *firestore.Client) *UserRepository {
	return &UserRepository{client: client}
}

var _ repositories.UserRepository = (*UserRepository)(nil)

func (r *UserRepository) Upsert(ctx context.Context, u *models.User) error {
	docRef := r.client.Collection("users").Doc(u.UID)
	now := time.Now().UTC()
	u.LastLoginAt = now
	if u.CreatedAt.IsZero() {
		u.CreatedAt = now
	}

	_, err := docRef.Set(ctx, map[string]interface{}{
		"uid":         u.UID,
		"email":       u.Email,
		"displayName": u.DisplayName,
		"photoURL":    u.PhotoURL,
		"createdAt":   u.CreatedAt,
		"lastLoginAt": u.LastLoginAt,
	}, firestore.MergeAll)
	return err
}

func (r *UserRepository) GetByID(ctx context.Context, uid string) (*models.User, error) {
	docSnap, err := r.client.Collection("users").Doc(uid).Get(ctx)
	if err != nil {
		if status.Code(err) == codes.NotFound {
			return nil, errors.New("user not found")
		}
		return nil, err
	}

	var u models.User
	if err := docSnap.DataTo(&u); err != nil {
		return nil, err
	}
	return &u, nil
}
