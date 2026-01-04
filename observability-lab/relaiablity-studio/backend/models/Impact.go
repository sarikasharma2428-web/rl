package models

type Impact struct {
	SLOAffected bool    `json:"slo_affected"`
	ErrorRate   float64 `json:"error_rate"`
	BadPods     int     `json:"bad_pods"`
}
