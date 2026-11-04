package middleware_test

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"golang.org/x/time/rate"

	"coffee-shop-backend/internal/middleware"
)

func TestRateLimiter_AllowsWithinLimit(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()

	limiter := middleware.NewIPRateLimiter(rate.Limit(5), 5)
	r.Use(limiter.Handler())
	r.GET("/ping", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	for i := 0; i < 5; i++ {
		w := httptest.NewRecorder()
		req, _ := http.NewRequest(http.MethodGet, "/ping", nil)
		r.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			t.Fatalf("expected 200 OK on iteration %d, got: %d", i, w.Code)
		}
	}
}

func TestRateLimiter_BlocksExcessRequests(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()

	// Strict rate limiter: 1 req/sec, burst 2
	limiter := middleware.NewIPRateLimiter(rate.Limit(1), 2)
	r.Use(limiter.Handler())
	r.GET("/ping", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	// First 2 requests consume the burst limit
	for i := 0; i < 2; i++ {
		w := httptest.NewRecorder()
		req, _ := http.NewRequest(http.MethodGet, "/ping", nil)
		r.ServeHTTP(w, req)
		if w.Code != http.StatusOK {
			t.Fatalf("expected 200 OK for request %d, got: %d", i, w.Code)
		}
	}

	// 3rd rapid request should be throttled with 429 Too Many Requests
	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodGet, "/ping", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusTooManyRequests {
		t.Fatalf("expected 429 Too Many Requests on burst excess, got: %d", w.Code)
	}
}

