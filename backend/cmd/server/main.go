package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"cloud.google.com/go/firestore"
	firebase "firebase.google.com/go/v4"
	"google.golang.org/api/option"

	"coffee-shop-backend/internal/config"
	"coffee-shop-backend/internal/handlers"
	"coffee-shop-backend/internal/middleware"
	"coffee-shop-backend/internal/repositories"
	firestoreRepo "coffee-shop-backend/internal/repositories/firestore"
	mockRepo "coffee-shop-backend/internal/repositories/mock"
	"coffee-shop-backend/internal/routes"
	"coffee-shop-backend/internal/services"
)

func main() {
	cfg := config.LoadConfig()
	ctx := context.Background()

	var productRepo repositories.ProductRepository
	var orderRepo repositories.OrderRepository
	var userRepo repositories.UserRepository
	var tokenVerifier middleware.TokenVerifier

	if cfg.UseMockDB {
		log.Println("==================================================================")
		log.Println("[INFO] Operating in Mock / In-Memory Mode.")
		log.Println("[INFO] Pre-seeded with 12 coffee shop products.")
		log.Println("[INFO] Allowed Owner Email:", cfg.OwnerEmail)
		log.Println("==================================================================")

		productRepo = mockRepo.NewMockProductRepository()
		orderRepo = mockRepo.NewMockOrderRepository()
		userRepo = mockRepo.NewMockUserRepository()
		tokenVerifier = &middleware.MockAuthVerifier{AllowedEmail: cfg.OwnerEmail}
	} else {
		log.Println("==================================================================")
		log.Println("[INFO] Initializing Firebase Admin SDK & Cloud Firestore...")
		log.Println("[INFO] Project ID:", cfg.FirebaseProjectID)
		log.Println("[INFO] Allowed Owner Email:", cfg.OwnerEmail)
		log.Println("==================================================================")

		var opts []option.ClientOption
		if cfg.FirebaseCredentialsJSON != "" {
			opts = append(opts, option.WithCredentialsJSON([]byte(cfg.FirebaseCredentialsJSON)))
		} else if cfg.GoogleApplicationCredentials != "" {
			if _, err := os.Stat(cfg.GoogleApplicationCredentials); os.IsNotExist(err) {
				log.Fatalf("[FATAL] Service account credentials file not found at: %s. Please check GOOGLE_APPLICATION_CREDENTIALS or set USE_MOCK_DB=true.", cfg.GoogleApplicationCredentials)
			}
			opts = append(opts, option.WithCredentialsFile(cfg.GoogleApplicationCredentials))
		}

		fbConfig := &firebase.Config{
			ProjectID: cfg.FirebaseProjectID,
		}

		app, err := firebase.NewApp(ctx, fbConfig, opts...)
		if err != nil {
			log.Fatalf("[FATAL] Failed to initialize Firebase App: %v", err)
		}

		authClient, err := app.Auth(ctx)
		if err != nil {
			log.Fatalf("[FATAL] Failed to initialize Firebase Auth client: %v", err)
		}

		var fsClient *firestore.Client
		if cfg.FirebaseCredentialsJSON != "" || cfg.GoogleApplicationCredentials != "" {
			fsClient, err = app.Firestore(ctx)
		} else {
			fsClient, err = firestore.NewClient(ctx, cfg.FirebaseProjectID, opts...)
		}
		if err != nil {
			log.Fatalf("[FATAL] Failed to initialize Firestore client: %v", err)
		}
		defer fsClient.Close()

		productRepo = firestoreRepo.NewProductRepository(fsClient)
		orderRepo = firestoreRepo.NewOrderRepository(fsClient)
		userRepo = firestoreRepo.NewUserRepository(fsClient)
		tokenVerifier = middleware.NewFirebaseAuthVerifier(authClient)
	}

	// Initialize domain services
	productService := services.NewProductService(productRepo)
	orderService := services.NewOrderService(orderRepo, productRepo)
	dashboardService := services.NewDashboardService(orderRepo)
	authService := services.NewAuthService(userRepo)

	// Initialize API handlers
	allHandlers := &routes.Handlers{
		Health:    handlers.NewHealthHandler(),
		Auth:      handlers.NewAuthHandler(authService),
		Product:   handlers.NewProductHandler(productService),
		Order:     handlers.NewOrderHandler(orderService),
		Dashboard: handlers.NewDashboardHandler(dashboardService),
	}

	// Setup Gin router
	router := routes.SetupRouter(cfg, tokenVerifier, allHandlers)

	srv := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      router,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
	}

	go func() {
		log.Printf("[INFO] Server listening on port %s (CORS origin: %s)...", cfg.Port, cfg.FrontendOrigin)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("[FATAL] Listen error: %s\n", err)
		}
	}()

	// Graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("[INFO] Shutting down server gracefully...")

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := srv.Shutdown(shutdownCtx); err != nil {
		log.Fatal("[FATAL] Server forced to shutdown:", err)
	}

	log.Println("[INFO] Server exited cleanly.")
}
