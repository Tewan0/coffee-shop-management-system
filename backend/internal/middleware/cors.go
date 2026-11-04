package middleware

import (
	"strings"

	"github.com/gin-gonic/gin"
)

func CORSMiddleware(allowedOrigin string) gin.HandlerFunc {
	origins := strings.Split(allowedOrigin, ",")
	allowedMap := make(map[string]bool)
	allowAll := false
	for _, o := range origins {
		trimmed := strings.TrimRight(strings.TrimSpace(o), "/")
		if trimmed == "*" || trimmed == "" {
			allowAll = true
		} else {
			allowedMap[trimmed] = true
		}
	}

	return func(c *gin.Context) {
		origin := strings.TrimRight(c.Request.Header.Get("Origin"), "/")
		if origin != "" {
			// Allow if:
			// 1. Wildcard allowAll is true
			// 2. Exact match in allowedMap
			// 3. Any Vercel deployment domain (*.vercel.app)
			// 4. Any localhost / 127.0.0.1 development port
			isVercel := strings.HasSuffix(origin, ".vercel.app")
			isLocal := strings.HasPrefix(origin, "http://localhost:") ||
				strings.HasPrefix(origin, "http://127.0.0.1:") ||
				origin == "http://localhost" ||
				origin == "http://127.0.0.1"

			if allowAll || allowedMap[origin] || isVercel || isLocal {
				c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
			}
		} else {
			c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		}

		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, PATCH, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}
