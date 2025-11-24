package tools

import (
	"encoding/json"
	"fmt"
	"sync"
)

// In-memory storage
var (
	storage      = make(map[string]string)
	storageMutex = &sync.RWMutex{}
)

// StorageSetInput represents input for storage_set
type StorageSetInput struct {
	Key   string `json:"key"`
	Value string `json:"value"`
}

// StorageGetInput represents input for storage_get
type StorageGetInput struct {
	Key string `json:"key"`
}

// StorageDeleteInput represents input for storage_delete
type StorageDeleteInput struct {
	Key string `json:"key"`
}

// StorageSet stores a key-value pair
func StorageSet(args map[string]interface{}) (interface{}, error) {
	argBytes, err := json.Marshal(args)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal arguments: %w", err)
	}

	var input StorageSetInput
	if err := json.Unmarshal(argBytes, &input); err != nil {
		return nil, fmt.Errorf("failed to unmarshal arguments: %w", err)
	}

	if input.Key == "" {
		return nil, fmt.Errorf("key is required")
	}

	storageMutex.Lock()
	defer storageMutex.Unlock()

	storage[input.Key] = input.Value

	return map[string]interface{}{
		"success": true,
		"message": fmt.Sprintf("Stored value for key '%s'", input.Key),
	}, nil
}

// StorageGet retrieves a value by key
func StorageGet(args map[string]interface{}) (interface{}, error) {
	argBytes, err := json.Marshal(args)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal arguments: %w", err)
	}

	var input StorageGetInput
	if err := json.Unmarshal(argBytes, &input); err != nil {
		return nil, fmt.Errorf("failed to unmarshal arguments: %w", err)
	}

	if input.Key == "" {
		return nil, fmt.Errorf("key is required")
	}

	storageMutex.RLock()
	defer storageMutex.RUnlock()

	value, exists := storage[input.Key]
	if !exists {
		return map[string]interface{}{
			"found": false,
			"key":   input.Key,
		}, nil
	}

	return map[string]interface{}{
		"found": true,
		"key":   input.Key,
		"value": value,
	}, nil
}

// StorageDelete deletes a key-value pair
func StorageDelete(args map[string]interface{}) (interface{}, error) {
	argBytes, err := json.Marshal(args)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal arguments: %w", err)
	}

	var input StorageDeleteInput
	if err := json.Unmarshal(argBytes, &input); err != nil {
		return nil, fmt.Errorf("failed to unmarshal arguments: %w", err)
	}

	if input.Key == "" {
		return nil, fmt.Errorf("key is required")
	}

	storageMutex.Lock()
	defer storageMutex.Unlock()

	_, exists := storage[input.Key]
	if !exists {
		return map[string]interface{}{
			"success": false,
			"message": fmt.Sprintf("Key '%s' not found", input.Key),
		}, nil
	}

	delete(storage, input.Key)

	return map[string]interface{}{
		"success": true,
		"message": fmt.Sprintf("Deleted key '%s'", input.Key),
	}, nil
}

// StorageList lists all stored keys
func StorageList(args map[string]interface{}) (interface{}, error) {
	storageMutex.RLock()
	defer storageMutex.RUnlock()

	keys := make([]string, 0, len(storage))
	for key := range storage {
		keys = append(keys, key)
	}

	return map[string]interface{}{
		"keys":  keys,
		"count": len(keys),
	}, nil
}

// GetStorageSetSchema returns the JSON schema for storage_set
func GetStorageSetSchema() map[string]interface{} {
	return map[string]interface{}{
		"type": "object",
		"properties": map[string]interface{}{
			"key": map[string]interface{}{
				"type":        "string",
				"description": "The key to store the value under",
			},
			"value": map[string]interface{}{
				"type":        "string",
				"description": "The value to store",
			},
		},
		"required": []string{"key", "value"},
	}
}

// GetStorageGetSchema returns the JSON schema for storage_get
func GetStorageGetSchema() map[string]interface{} {
	return map[string]interface{}{
		"type": "object",
		"properties": map[string]interface{}{
			"key": map[string]interface{}{
				"type":        "string",
				"description": "The key to retrieve",
			},
		},
		"required": []string{"key"},
	}
}

// GetStorageDeleteSchema returns the JSON schema for storage_delete
func GetStorageDeleteSchema() map[string]interface{} {
	return map[string]interface{}{
		"type": "object",
		"properties": map[string]interface{}{
			"key": map[string]interface{}{
				"type":        "string",
				"description": "The key to delete",
			},
		},
		"required": []string{"key"},
	}
}

// GetStorageListSchema returns the JSON schema for storage_list
func GetStorageListSchema() map[string]interface{} {
	return map[string]interface{}{
		"type":       "object",
		"properties": map[string]interface{}{},
	}
}
