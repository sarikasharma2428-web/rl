package models

type SLO struct {
	ServiceName string  `json:"service_name"`
	Objective   float64 `json:"objective"`
	ErrorBudget float64 `json:"error_budget"`
	BurnRate    float64 `json:"burn_rate"`
	Status      string  `json:"status"`
}
