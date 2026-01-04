package handlers

import (
	"encoding/json"
	"net/http"

	"reliability-studio-backend/services"
)

func GetK8sStatus(w http.ResponseWriter, r *http.Request) {
	data := services.GetCluster()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"raw": data,
	})
}

