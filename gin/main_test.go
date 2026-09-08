package main

import (
	"context"
	"os"
	"testing"
)

func TestProbeRejectsMissingDatabaseURL(t *testing.T) {
	if _, err := probeDatabase(context.Background(), ""); err == nil {
		t.Fatal("expected missing database URL to fail")
	}
}

func TestProbePersistsCounter(t *testing.T) {
	databaseURL := os.Getenv("TEST_DATABASE_URL")
	if databaseURL == "" {
		t.Skip("TEST_DATABASE_URL is required for integration coverage")
	}
	first, err := probeDatabase(context.Background(), databaseURL)
	if err != nil {
		t.Fatal(err)
	}
	second, err := probeDatabase(context.Background(), databaseURL)
	if err != nil {
		t.Fatal(err)
	}
	if first < 1 || second != first+1 {
		t.Fatalf("expected persisted increment, got %d then %d", first, second)
	}
}
