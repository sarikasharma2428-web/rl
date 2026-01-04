package correlation

type Incident struct {
	ID          string
	Service     string
	RootCause   string
	Severity    string
	Timeline    []Event
	Impact      Impact
}

type Event struct {
	Time    string
	Source  string
	Message string
}

type Impact struct {
	SLOAffected bool
	ErrorRate   float64
	BadPods     int
}
