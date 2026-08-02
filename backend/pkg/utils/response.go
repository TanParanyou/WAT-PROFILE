package utils

import "github.com/gofiber/fiber/v2"

// SuccessResponse sends a successful JSON response
func SuccessResponse(c *fiber.Ctx, data interface{}) error {
	return c.JSON(fiber.Map{
		"success": true,
		"data":    data,
	})
}

// ErrorResponse sends an error JSON response
func ErrorResponse(c *fiber.Ctx, statusCode int, message string) error {
	traceID, _ := c.Locals("trace_id").(string)
	if traceID == "" {
		traceID = c.GetRespHeader("X-Trace-Id")
	}

	return c.Status(statusCode).JSON(fiber.Map{
		"success":  false,
		"error":    message,
		"trace_id": traceID,
	})
}

// CodedErrorResponse sends an error JSON response with a stable machine-readable code
func CodedErrorResponse(c *fiber.Ctx, statusCode int, code, message string) error {
	traceID, _ := c.Locals("trace_id").(string)
	if traceID == "" {
		traceID = c.GetRespHeader("X-Trace-Id")
	}

	return c.Status(statusCode).JSON(fiber.Map{
		"success":  false,
		"error":    message,
		"code":     code,
		"trace_id": traceID,
	})
}

// PaginatedResponse sends a paginated JSON response
func PaginatedResponse(c *fiber.Ctx, data interface{}, page, limit, total int) error {
	totalPages := 0
	if limit > 0 && total > 0 {
		totalPages = (total + limit - 1) / limit
	}
	return c.JSON(fiber.Map{
		"success": true,
		"data":    data,
		"pagination": fiber.Map{
			"page":       page,
			"limit":      limit,
			"total":      total,
			"totalPages": totalPages,
		},
	})
}

// MessageResponse sends a simple message response
func MessageResponse(c *fiber.Ctx, message string) error {
	return c.JSON(fiber.Map{
		"success": true,
		"message": message,
	})
}
