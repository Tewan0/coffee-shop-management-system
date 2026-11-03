package config

import (
	"log"
	"os"
	"strings"

	"github.com/joho/godotenv"
)

type Config struct {
	Port                         string
	FirebaseProjectID            string
	GoogleApplicationCredentials string
	OwnerEmail                   string
	FrontendOrigin               string
	UseMockDB                    bool // When true or when credentials are missing, falls back to in-memory mock for dev/testing
}

func LoadConfig() *Config {
	// Load .env if it exists (ignore error if not found)
	_ = godotenv.Load()

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	frontendOrigin := os.Getenv("FRONTEND_ORIGIN")
	if frontendOrigin == "" {
		frontendOrigin = "http://localhost:3000"
	}

	ownerEmail := strings.ToLower(strings.TrimSpace(os.Getenv("OWNER_EMAIL")))

	useMock := os.Getenv("USE_MOCK_DB") == "true"
	creds := os.Getenv("GOOGLE_APPLICATION_CREDENTIALS")
	projectID := os.Getenv("FIREBASE_PROJECT_ID")

	if creds == "" && projectID == "" && !useMock {
		log.Println("[INFO] Neither GOOGLE_APPLICATION_CREDENTIALS nor FIREBASE_PROJECT_ID is set. Defaulting to in-memory mock database mode for local development/testing.")
		useMock = true
	}

	return &Config{
		Port:                         port,
		FirebaseProjectID:            projectID,
		GoogleApplicationCredentials: creds,
		OwnerEmail:                   ownerEmail,
		FrontendOrigin:               frontendOrigin,
		UseMockDB:                    useMock,
	}
}
