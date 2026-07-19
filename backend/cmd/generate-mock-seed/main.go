package main

import (
	"flag"
	"fmt"
	"os"
	"path/filepath"

	"github.com/watloungporsai/wat-profile-backend/internal/seedgen"
)

func main() {
	repoRoot := flag.String("repo-root", "..", "repository root containing frontend and backend")
	outputDirectory := flag.String("output-dir", "migrations", "migration output directory")
	flag.Parse()

	bundle, err := seedgen.LoadFixtures(*repoRoot)
	if err != nil {
		fail(err)
	}
	snapshot, err := seedgen.Normalize(bundle)
	if err != nil {
		fail(err)
	}
	up, down, err := seedgen.RenderMigrations(snapshot)
	if err != nil {
		fail(err)
	}
	if err := seedgen.WriteMigrations(*outputDirectory, up, down); err != nil {
		fail(err)
	}
	fmt.Printf("generated %s and %s\n", filepath.Join(*outputDirectory, "000017_replace_public_mock_data.up.sql"), filepath.Join(*outputDirectory, "000017_replace_public_mock_data.down.sql"))
}

func fail(err error) {
	fmt.Fprintln(os.Stderr, err)
	os.Exit(1)
}
