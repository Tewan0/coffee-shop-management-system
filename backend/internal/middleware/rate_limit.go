package middleware

import (
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"golang.org/x/time/rate"

	"coffee-shop-backend/internal/models"
)

type clientRecord struct {
	limiter  *rate.Limiter
	lastSeen time.Time
}

// IPRateLimiter provides per-client-IP token bucket rate limiting
type IPRateLimiter struct {
	mu      sync.Mutex
	clients map[string]*clientRecord
	limit   rate.Limit
	burst   int
}

// NewIPRateLimiter creates a new rate limiter with requests per second and burst capacity
func NewIPRateLimiter(r rate.Limit, b int) *IPRateLimiter {
	limiter := &IPRateLimiter{
		clients: make(map[string]*clientRecord),
		limit:   r,
		burst:   b,
	}

	// Periodically prune inactive client records to avoid memory leaks
	go func() {
		ticker := time.NewTicker(3 * time.Minute)
		defer ticker.Stop()
		for range ticker.C {
			limiter.cleanup(10 * time.Minute)
		}
	}()

	return limiter
}

func (l *IPRateLimiter) getLimiter(ip string) *rate.Limiter {
	l.mu.Lock()
	defer l.mu.Unlock()

	client, exists := l.clients[ip]
	if !exists {
		clientLimiter := rate.NewLimiter(l.limit, l.burst)
		l.clients[ip] = &clientRecord{
			limiter:  clientLimiter,
			lastSeen: time.Now(),
		}
		return clientLimiter
	}

	client.lastSeen = time.Now()
	return client.limiter
}

func (l *IPRateLimiter) cleanup(maxAge time.Duration) {
	l.mu.Lock()
	defer l.mu.Unlock()

	now := time.Now()
	for ip, record := range l.clients {
		if now.Sub(record.lastSeen) > maxAge {
			delete(l.clients, ip)
		}
	}
}

// Handler returns a Gin middleware function that enforces rate limiting
func (l *IPRateLimiter) Handler() gin.HandlerFunc {
	return func(c *gin.Context) {
		clientIP := c.ClientIP()
		limiter := l.getLimiter(clientIP)

		if !limiter.Allow() {
			c.AbortWithStatusJSON(http.StatusTooManyRequests, models.APIResponse{
				Success: false,
				Error:   "Too many requests. Please slow down and try again shortly.",
			})
			return
		}

		c.Next()
	}
}

