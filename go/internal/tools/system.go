package tools

import (
	"fmt"
	"runtime"
	"time"
)

var startTime = time.Now()

// SystemInfo returns system information
func SystemInfo(args map[string]interface{}) (interface{}, error) {
	var memStats runtime.MemStats
	runtime.ReadMemStats(&memStats)

	return map[string]interface{}{
		"platform":      runtime.GOOS,
		"architecture":  runtime.GOARCH,
		"goVersion":     runtime.Version(),
		"numCPU":        runtime.NumCPU(),
		"numGoroutine":  runtime.NumGoroutine(),
		"uptime":        time.Since(startTime).String(),
		"memory": map[string]interface{}{
			"alloc":      fmt.Sprintf("%d MB", memStats.Alloc/1024/1024),
			"totalAlloc": fmt.Sprintf("%d MB", memStats.TotalAlloc/1024/1024),
			"sys":        fmt.Sprintf("%d MB", memStats.Sys/1024/1024),
			"numGC":      memStats.NumGC,
		},
		"serverType": "Go MCP Server",
		"timestamp":  time.Now().Format(time.RFC3339),
	}, nil
}

// GetSystemInfoSchema returns the JSON schema for system_info
func GetSystemInfoSchema() map[string]interface{} {
	return map[string]interface{}{
		"type":       "object",
		"properties": map[string]interface{}{},
	}
}
