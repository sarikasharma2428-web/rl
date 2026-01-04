package handlers

import (
	"encoding/json"
	"net/http"

	"reliability-studio-backend/services"
)

func GetIncidents(w http.ResponseWriter, r *http.Request) {
	query := `{job="sample-app"} |= "error"`
	data := services.QueryLogs(query)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"raw": data,
	})
}
