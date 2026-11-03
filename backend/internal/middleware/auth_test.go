package middleware_test

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"

	"coffee-shop-backend/internal/middleware"
	"coffee-shop-backend/internal/models"
)

type mockCustomVerifier struct {
	uid      string
	email    string
	name     string
	verified bool
	err      error
}

func (m *mockCustomVerifier) VerifyIDToken(c *gin.Context, idToken string) (string, string, string, string, bool, error) {
	if m.err != nil {
		return "", "", "", "", false, m.err
	}
	return m.uid, m.email, m.name, "", m.verified, nil
}

func TestAuthMiddleware_MissingHeader_Returns401(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	verifier := &mockCustomVerifier{}
	r.Use(middleware.AuthMiddleware(verifier, "owner@coffeeshop.com"))
	r.GET("/protected", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"ok": true})
	})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodGet, "/protected", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401 Unauthorized, got: %d", w.Code)
	}

	var res models.APIResponse
	_ = json.Unmarshal(w.Body.Bytes(), &res)
	if res.Success {
		t.Errorf("expected success to be false")
	}
}

func TestAuthMiddleware_NonOwner_Returns403(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	verifier := &mockCustomVerifier{
		uid:      "other-uid",
		email:    "stranger@gmail.com",
		verified: true,
	}
	r.Use(middleware.AuthMiddleware(verifier, "owner@coffeeshop.com"))
	r.GET("/protected", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"ok": true})
	})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodGet, "/protected", nil)
	req.Header.Set("Authorization", "Bearer valid-token-but-not-owner")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusForbidden {
		t.Fatalf("expected 403 Forbidden, got: %d", w.Code)
	}
}

func TestAuthMiddleware_OwnerAllowed_Returns200(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	verifier := &mockCustomVerifier{
		uid:      "owner-uid",
		email:    "owner@coffeeshop.com",
		name:     "Shop Owner",
		verified: true,
	}
	r.Use(middleware.AuthMiddleware(verifier, "owner@coffeeshop.com"))
	r.GET("/protected", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"ok": true, "uid": c.GetString("uid")})
	})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodGet, "/protected", nil)
	req.Header.Set("Authorization", "Bearer valid-owner-token")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200 OK, got: %d", w.Code)
	}
}
