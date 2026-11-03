package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"coffee-shop-backend/internal/models"
	"coffee-shop-backend/internal/services"
)

type AuthHandler struct {
	authService *services.AuthService
}

func NewAuthHandler(authService *services.AuthService) *AuthHandler {
	return &AuthHandler{authService: authService}
}

func (h *AuthHandler) Me(c *gin.Context) {
	uid, _ := c.Get("uid")
	email, _ := c.Get("email")
	displayName, _ := c.Get("displayName")
	photoURL, _ := c.Get("photoURL")

	uidStr, _ := uid.(string)
	emailStr, _ := email.(string)
	nameStr, _ := displayName.(string)
	photoStr, _ := photoURL.(string)

	user, err := h.authService.SyncUserProfile(c.Request.Context(), uidStr, emailStr, nameStr, photoStr)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Error:   "Failed to synchronize user profile",
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Data:    user,
	})
}
