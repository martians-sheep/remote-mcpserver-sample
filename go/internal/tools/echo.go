package tools

import (
	"encoding/json"
	"fmt"
	"time"
)

// EchoInput represents input for echo tool
type EchoInput struct {
	Message string `json:"message"`
}

// Echo returns the input message
func Echo(args map[string]interface{}) (interface{}, error) {
	argBytes, err := json.Marshal(args)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal arguments: %w", err)
	}

	var input EchoInput
	if err := json.Unmarshal(argBytes, &input); err != nil {
		return nil, fmt.Errorf("failed to unmarshal arguments: %w", err)
	}

	if input.Message == "" {
		return nil, fmt.Errorf("message is required")
	}

	return map[string]interface{}{
		"echo":      input.Message,
		"length":    len(input.Message),
		"timestamp": time.Now().Format(time.RFC3339),
	}, nil
}

// GetEchoSchema returns the JSON schema for echo
func GetEchoSchema() map[string]interface{} {
	return map[string]interface{}{
		"type": "object",
		"properties": map[string]interface{}{
			"message": map[string]interface{}{
				"type":        "string",
				"description": "The message to echo back",
			},
		},
		"required": []string{"message"},
	}
}
