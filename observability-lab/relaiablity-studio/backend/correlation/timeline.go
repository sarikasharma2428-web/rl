package correlation

import "reliability-studio-backend/analysis"

func BuildTimeline(
	logs analysis.LogResult,
	metrics analysis.MetricResult,
	traces analysis.TraceResult,
	k8s analysis.K8sResult,
) []Event {

	var timeline []Event

	for _, e := range logs.Events {
		timeline = append(timeline, Event{Time: e.Time, Source: "logs", Message: e.Message})
	}

	for _, e := range traces.Events {
		timeline = append(timeline, Event{Time: e.Time, Source: "traces", Message: e.Message})
	}

	for _, e := range k8s.Events {
		timeline = append(timeline, Event{Time: e.Time, Source: "k8s", Message: e.Message})
	}

	return timeline
}
