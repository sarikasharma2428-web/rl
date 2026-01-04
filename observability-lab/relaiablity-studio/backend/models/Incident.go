package handlers

import (
	"encoding/json"
	"net/http"

	"reliability-studio-backend/services"
)

func GetIncidents(w http.ResponseWriter, r *http.Request) {
	data := services.FetchIncidents()
	json.NewEncoder(w).Encode(data)
}
