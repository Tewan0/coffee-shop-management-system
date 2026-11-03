package routes

import (
	"github.com/gin-gonic/gin"

	"coffee-shop-backend/internal/config"
	"coffee-shop-backend/internal/handlers"
	"coffee-shop-backend/internal/middleware"
)

type Handlers struct {
	Health    *handlers.HealthHandler
	Auth      *handlers.AuthHandler
	Product   *handlers.ProductHandler
	Order     *handlers.OrderHandler
	Dashboard *handlers.DashboardHandler
}

func SetupRouter(cfg *config.Config, verifier middleware.TokenVerifier, h *Handlers) *gin.Engine {
	r := gin.New()
	r.Use(gin.Logger())
	r.Use(gin.Recovery())
	r.Use(middleware.CORSMiddleware(cfg.FrontendOrigin))

	// Public endpoints
	r.GET("/health", h.Health.Check)

	// Protected endpoints under /api/v1
	v1 := r.Group("/api/v1")
	v1.Use(middleware.AuthMiddleware(verifier, cfg.OwnerEmail))
	{
		// Authentication & Current User
		v1.GET("/auth/me", h.Auth.Me)

		// Product / Menu Management
		products := v1.Group("/products")
		{
			products.GET("", h.Product.List)
			products.GET("/:id", h.Product.GetByID)
			products.POST("", h.Product.Create)
			products.PUT("/:id", h.Product.Update)
			products.PATCH("/:id/status", h.Product.SetStatus)
		}

		// Orders / POS & Sales History
		orders := v1.Group("/orders")
		{
			orders.POST("", h.Order.Create)
			orders.GET("", h.Order.List)
			orders.GET("/:id", h.Order.GetByID)
		}

		// Dashboard & Reporting
		dashboard := v1.Group("/dashboard")
		{
			dashboard.GET("/summary", h.Dashboard.GetSummary)
		}
	}

	return r
}
