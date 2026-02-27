package repository

import (
	"database/sql"
	"fmt"
)

type YogaRepository interface {
	Ping() error
}

type yogaRepository struct {
	db *sql.DB
}

func NewYogaRepository(db *sql.DB) YogaRepository {
	return &yogaRepository{db: db}
}

func (r *yogaRepository) Ping() error {
	if err := r.db.Ping(); err != nil {
		return fmt.Errorf("database ping failed: %w", err)
	}
	return nil
}

func ConnectDB(dsn string) (*sql.DB, error) {
	db, err := sql.Open("postgres", dsn)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(5)

	return db, nil
}
