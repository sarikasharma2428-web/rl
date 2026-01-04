package correlation

import (
	"reliability-studio-backend/analysis"
)

func BuildIncident(service string) Incident {
	logs := analysis.AnalyzeLogs(service)
	metrics := analysis.AnalyzeMetrics(service)
	traces := analysis.AnalyzeTraces(service)
	k8s := analysis.AnalyzeK8s(service)

	impact := Impact{
		SLOAffected: metrics.ErrorRate > 1,
		ErrorRate:   metrics.ErrorRate,
		BadPods:     k8s.BadPods,
	}

	return Incident{
		ID:        service + "-incident",
		Service:   service,
		RootCause: logs.RootCause,
		Severity:  calculateSeverity(impact),
		Timeline:  BuildTimeline(logs, metrics, traces, k8s),
		Impact:    impact,
	}
}

func calculateSeverity(impact Impact) string {
	if impact.BadPods > 3 || impact.ErrorRate > 5 {
		return "critical"
	}
	if impact.ErrorRate > 1 {
		return "warning"
	}
	return "healthy"
}
