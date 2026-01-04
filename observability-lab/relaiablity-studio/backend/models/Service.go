package models

type Service struct {
	Name        string `json:"name"`
	Environment string `json:"environment"`
	Owner       string `json:"owner"`
}
