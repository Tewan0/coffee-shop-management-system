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
	FirebaseCredentialsJSON      string // Allow passing full service account JSON via env var
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
		frontendOrigin = os.Getenv("ALLOWED_ORIGINS")
	}
	if frontendOrigin == "" {
		frontendOrigin = os.Getenv("ALLOWED_ORIGIN")
	}
	if frontendOrigin == "" {
		frontendOrigin = "http://localhost:3000"
	}

	ownerEmail := strings.ToLower(strings.TrimSpace(os.Getenv("OWNER_EMAIL")))
	if ownerEmail == "" {
		ownerEmail = "nawutse8787za@gmail.com"
	}

	useMock := os.Getenv("USE_MOCK_DB") == "true"
	creds := os.Getenv("GOOGLE_APPLICATION_CREDENTIALS")
	credsJSON := os.Getenv("FIREBASE_CREDENTIALS_JSON")
	if credsJSON == "" {
		credsJSON = os.Getenv("SERVICE_ACCOUNT_JSON")
	}
	projectID := os.Getenv("FIREBASE_PROJECT_ID")

	// Check credentials file on disk if JSON is not provided directly in env
	if credsJSON == "" && creds != "" && !useMock {
		if _, err := os.Stat(creds); os.IsNotExist(err) {
			if _, err2 := os.Stat(creds + ".json"); err2 == nil {
				log.Printf("[INFO] Detected '%s.json', using it for credentials.", creds)
				creds = creds + ".json"
			} else {
				log.Printf("[WARN] Service account key not found at '%s'. Automatically falling back to mock mode.", creds)
				useMock = true
			}
		}
	}

	if credsJSON == "" && creds == "" && projectID == "" && !useMock {
		log.Println("[INFO] Neither credentials nor FIREBASE_PROJECT_ID is set. Defaulting to in-memory mock database mode.")
		useMock = true
	}

	return &Config{
		Port:                         port,
		FirebaseProjectID:            projectID,
		GoogleApplicationCredentials: creds,
		FirebaseCredentialsJSON:      credsJSON,
		OwnerEmail:                   ownerEmail,
		FrontendOrigin:               frontendOrigin,
		UseMockDB:                    useMock,
	}
}
