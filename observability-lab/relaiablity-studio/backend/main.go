package main

import (
	"log"
	"net/http"

	"github.com/gorilla/mux"

	"reliability-studio-backend/handlers"
)

func main() {
	r := mux.NewRouter()

	r.HandleFunc("/api/incidents", handlers.GetIncidents).Methods("GET")
	r.HandleFunc("/api/slo", handlers.GetSLOStatus).Methods("GET")
	r.HandleFunc("/api/k8s", handlers.GetK8sStatus).Methods("GET")

	log.Println("Reliability Studio backend running on :9000")
	log.Fatal(http.ListenAndServe(":9000", r))
}
