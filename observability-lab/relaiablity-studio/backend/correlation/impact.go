package correlation

func CalculateImpact(errorRate float64, badPods int) Impact {
	return Impact{
		SLOAffected: errorRate > 1,
		ErrorRate:   errorRate,
		BadPods:    badPods,
	}
}
