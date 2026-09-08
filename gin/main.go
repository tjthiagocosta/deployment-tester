package main

import (
	"context"
	"database/sql"
	"fmt"
	"net/http"
	"net/url"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	_ "github.com/lib/pq"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "3000"
	}

	gin.SetMode(gin.ReleaseMode)
	r := gin.New()
	r.Use(gin.Recovery())

	r.GET("/", func(c *gin.Context) {
		c.Data(http.StatusOK, "text/html; charset=utf-8", []byte(`<h1 id="probe-marker">GIN_LIVE</h1>`))
	})
	r.GET("/healthz", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"ok": true, "framework": "gin", "port": port})
	})

	r.GET("/db-test", func(c *gin.Context) {
		counter, err := probeDatabase(c.Request.Context(), os.Getenv("DATABASE_URL"))
		if err != nil {
			c.JSON(http.StatusServiceUnavailable, gin.H{"ok": false, "framework": "gin", "error": "Database probe failed"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"ok": true, "framework": "gin", "database": "postgresql", "counter": counter})
	})

	if err := r.Run("0.0.0.0:" + port); err != nil {
		panic(err)
	}
}

func probeDatabase(parent context.Context, databaseURL string) (int, error) {
	if databaseURL == "" {
		return 0, fmt.Errorf("DATABASE_URL is required")
	}
	parsedURL, err := url.Parse(databaseURL)
	if err != nil || (parsedURL.Scheme != "postgres" && parsedURL.Scheme != "postgresql") {
		return 0, fmt.Errorf("expected a PostgreSQL URL")
	}
	query := parsedURL.Query()
	if !query.Has("sslmode") {
		// The fixture targets Nouva's private same-server database network.
		query.Set("sslmode", "disable")
		parsedURL.RawQuery = query.Encode()
	}
	ctx, cancel := context.WithTimeout(parent, 10*time.Second)
	defer cancel()
	db, err := sql.Open("postgres", parsedURL.String())
	if err != nil {
		return 0, err
	}
	defer db.Close()
	if _, err = db.ExecContext(ctx, "CREATE TABLE IF NOT EXISTS nouva_deployment_probe (fixture TEXT PRIMARY KEY, counter INTEGER NOT NULL)"); err != nil {
		return 0, err
	}
	if _, err = db.ExecContext(ctx, "INSERT INTO nouva_deployment_probe (fixture, counter) VALUES ('gin', 1) ON CONFLICT (fixture) DO UPDATE SET counter = nouva_deployment_probe.counter + 1"); err != nil {
		return 0, err
	}
	var counter int
	err = db.QueryRowContext(ctx, "SELECT counter FROM nouva_deployment_probe WHERE fixture = 'gin'").Scan(&counter)
	return counter, err
}
