package middleware

import (
	"fmt"
	"net/http"
	"strings"

	"firebase.google.com/go/v4/auth"
	"github.com/gin-gonic/gin"

	"coffee-shop-backend/internal/models"
)

type TokenVerifier interface {
	VerifyIDToken(ctx *gin.Context, idToken string) (uid string, email string, name string, picture string, verified bool, err error)
}

// FirebaseAuthVerifier wraps *auth.Client
type FirebaseAuthVerifier struct {
	client *auth.Client
}

func NewFirebaseAuthVerifier(client *auth.Client) *FirebaseAuthVerifier {
	return &FirebaseAuthVerifier{client: client}
}

func (v *FirebaseAuthVerifier) VerifyIDToken(c *gin.Context, idToken string) (string, string, string, string, bool, error) {
	if v.client == nil {
		return "", "", "", "", false, fmt.Errorf("firebase auth client is not initialized")
	}

	token, err := v.client.VerifyIDToken(c.Request.Context(), idToken)
	if err != nil {
		return "", "", "", "", false, err
	}

	email, _ := token.Claims["email"].(string)
	name, _ := token.Claims["name"].(string)
	picture, _ := token.Claims["picture"].(string)
	emailVerified, _ := token.Claims["email_verified"].(bool)

	return token.UID, email, name, picture, emailVerified, nil
}

// MockAuthVerifier for offline development and unit tests
type MockAuthVerifier struct {
	AllowedEmail string
}

func (m *MockAuthVerifier) VerifyIDToken(c *gin.Context, idToken string) (string, string, string, string, bool, error) {
	// If bearer token is provided in mock mode
	if idToken == "mock-owner-token" || strings.HasPrefix(idToken, "mock-") {
		return "mock-owner-uid", m.AllowedEmail, "Store Owner", "", true, nil
	}
	// Decode pseudo jwt if test token or return error
	if strings.Contains(idToken, "unauthorized") {
		return "unauthorized-uid", "stranger@gmail.com", "Stranger", "", true, nil
	}
	return "mock-owner-uid", m.AllowedEmail, "Store Owner", "", true, nil
}

func AuthMiddleware(verifier TokenVerifier, ownerEmail string) gin.HandlerFunc {
	// Parse one or more comma-separated allowed owner emails
	allowedEmails := make(map[string]bool)
	for _, e := range strings.Split(ownerEmail, ",") {
		clean := strings.ToLower(strings.TrimSpace(e))
		if clean != "" {
			allowedEmails[clean] = true
		}
	}

	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, models.APIResponse{
				Success: false,
				Error:   "Authorization header is missing",
			})
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
			c.AbortWithStatusJSON(http.StatusUnauthorized, models.APIResponse{
				Success: false,
				Error:   "Invalid authorization format. Must be Bearer <token>",
			})
			return
		}

		tokenString := strings.TrimSpace(parts[1])
		if tokenString == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, models.APIResponse{
				Success: false,
				Error:   "Bearer token cannot be empty",
			})
			return
		}

		uid, email, name, picture, verified, err := verifier.VerifyIDToken(c, tokenString)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, models.APIResponse{
				Success: false,
				Error:   "Invalid or expired authentication token",
			})
			return
		}

		// Security requirement: Check verified email and match OWNER_EMAIL
		normalizedUserEmail := strings.ToLower(strings.TrimSpace(email))
		if !verified {
			c.AbortWithStatusJSON(http.StatusUnauthorized, models.APIResponse{
				Success: false,
				Error:   "Google email address has not been verified",
			})
			return
		}

		if len(allowedEmails) == 0 || !allowedEmails[normalizedUserEmail] {
			c.AbortWithStatusJSON(http.StatusForbidden, models.APIResponse{
				Success: false,
				Error:   "Access forbidden: store owner email is not configured or unauthorized",
			})
			return
		}

		// Context attributes
		c.Set("uid", uid)
		c.Set("email", email)
		c.Set("displayName", name)
		c.Set("photoURL", picture)

		c.Next()
	}
}

