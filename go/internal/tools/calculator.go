package tools

import (
	"encoding/json"
	"fmt"
)

// CalculatorInput represents the input parameters for calculator operations
type CalculatorInput struct {
	Operation string  `json:"operation"`
	A         float64 `json:"a"`
	B         float64 `json:"b"`
}

// CalculatorResult represents the result of a calculator operation
type CalculatorResult struct {
	Result    float64 `json:"result"`
	Operation string  `json:"operation"`
}

// Calculator performs basic arithmetic operations
func Calculator(args map[string]interface{}) (interface{}, error) {
	// Parse input
	argBytes, err := json.Marshal(args)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal arguments: %w", err)
	}

	var input CalculatorInput
	if err := json.Unmarshal(argBytes, &input); err != nil {
		return nil, fmt.Errorf("failed to unmarshal arguments: %w", err)
	}

	// Validate operation
	var result float64
	switch input.Operation {
	case "add":
		result = input.A + input.B
	case "subtract":
		result = input.A - input.B
	case "multiply":
		result = input.A * input.B
	case "divide":
		if input.B == 0 {
			return nil, fmt.Errorf("division by zero")
		}
		result = input.A / input.B
	default:
		return nil, fmt.Errorf("unsupported operation: %s", input.Operation)
	}

	return CalculatorResult{
		Result:    result,
		Operation: fmt.Sprintf("%g %s %g = %g", input.A, input.Operation, input.B, result),
	}, nil
}

// GetCalculatorSchema returns the JSON schema for calculator tool
func GetCalculatorSchema() map[string]interface{} {
	return map[string]interface{}{
		"type": "object",
		"properties": map[string]interface{}{
			"operation": map[string]interface{}{
				"type":        "string",
				"enum":        []string{"add", "subtract", "multiply", "divide"},
				"description": "The arithmetic operation to perform",
			},
			"a": map[string]interface{}{
				"type":        "number",
				"description": "First operand",
			},
			"b": map[string]interface{}{
				"type":        "number",
				"description": "Second operand",
			},
		},
		"required": []string{"operation", "a", "b"},
	}
}
