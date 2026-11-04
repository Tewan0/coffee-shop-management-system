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
			// 2. Exact match in allowedMap (configured via FRONTEND_ORIGIN / ALLOWED_ORIGINS)
			// 3. Any Vercel deployment domain (*.vercel.app)
			// 4. Any localhost / 127.0.0.1 development port
			// 5. Local LAN IP for mobile testing (192.168.x.x, 10.x.x.x, 172.x.x.x)
			isVercel := strings.HasSuffix(origin, ".vercel.app")
			isLocal := strings.HasPrefix(origin, "http://localhost:") ||
				strings.HasPrefix(origin, "http://127.0.0.1:") ||
				origin == "http://localhost" ||
				origin == "http://127.0.0.1"
			isLAN := strings.HasPrefix(origin, "http://192.168.") ||
				strings.HasPrefix(origin, "http://10.") ||
				strings.HasPrefix(origin, "http://172.")

			if allowAll || allowedMap[origin] || isVercel || isLocal || isLAN {
				c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
				c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
			}
		} else {
			c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		}
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, PATCH, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}
