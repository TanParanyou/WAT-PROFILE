package listquery

import (
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
)

type Common struct {
	Page   int
	Limit  int
	Search string
	Sort   string
	Order  string
	From   *time.Time
	To     *time.Time
}

type Config struct {
	DefaultSort  string
	DefaultOrder string
	AllowedSort  map[string]string
	MaxSearch    int
}

func Parse(c *fiber.Ctx, config Config) (Common, error) {
	page, err := strconv.Atoi(c.Query("page", "1"))
	if err != nil || page < 1 {
		return Common{}, fmt.Errorf("page must be a positive integer")
	}
	limit, err := strconv.Atoi(c.Query("limit", "25"))
	if err != nil || (limit != 10 && limit != 25 && limit != 50 && limit != 100) {
		return Common{}, fmt.Errorf("limit must be one of 10, 25, 50, or 100")
	}
	defaultOrder := config.DefaultOrder
	if defaultOrder == "" {
		defaultOrder = "desc"
	}
	order := strings.ToLower(c.Query("order", defaultOrder))
	if order != "asc" && order != "desc" {
		return Common{}, fmt.Errorf("order must be asc or desc")
	}
	sortKey := c.Query("sort", config.DefaultSort)
	if sortKey != "" && config.AllowedSort != nil {
		if _, ok := config.AllowedSort[sortKey]; !ok {
			return Common{}, fmt.Errorf("unsupported sort")
		}
	}
	search := strings.TrimSpace(c.Query("search"))
	maxSearch := config.MaxSearch
	if maxSearch == 0 {
		maxSearch = 200
	}
	if len([]rune(search)) > maxSearch {
		return Common{}, fmt.Errorf("search is too long")
	}
	from, err := parseDate(c.Query("from"))
	if err != nil {
		return Common{}, fmt.Errorf("from must use yyyy-mm-dd")
	}
	to, err := parseDate(c.Query("to"))
	if err != nil {
		return Common{}, fmt.Errorf("to must use yyyy-mm-dd")
	}
	if from != nil && to != nil && from.After(*to) {
		return Common{}, fmt.Errorf("from must not be after to")
	}
	return Common{
		Page:   page,
		Limit:  limit,
		Search: search,
		Sort:   sortKey,
		Order:  order,
		From:   from,
		To:     to,
	}, nil
}

func parseDate(s string) (*time.Time, error) {
	s = strings.TrimSpace(s)
	if s == "" {
		return nil, nil
	}
	t, err := time.Parse("2006-01-02", s)
	if err != nil {
		return nil, err
	}
	return &t, nil
}

// ExtractMulti reads repeated query parameter values (e.g. ?status=active&status=inactive)
func ExtractMulti(c *fiber.Ctx, key string) []string {
	var results []string
	args := c.Context().QueryArgs().PeekMulti(key)
	seen := make(map[string]bool)
	for _, arg := range args {
		val := strings.TrimSpace(string(arg))
		if val != "" && !seen[val] {
			seen[val] = true
			results = append(results, val)
		}
	}
	return results
}

// AllowedValues validates that all values in slice exist in allowed map
func AllowedValues(values []string, allowed map[string]struct{}) error {
	for _, v := range values {
		if _, ok := allowed[v]; !ok {
			return fmt.Errorf("invalid value: %s", v)
		}
	}
	return nil
}

// AllowedSort validates a sort key against allowed map
func AllowedSort(sortKey string, allowed map[string]string) (string, error) {
	if col, ok := allowed[sortKey]; ok {
		return col, nil
	}
	return "", fmt.Errorf("unsupported sort: %s", sortKey)
}
