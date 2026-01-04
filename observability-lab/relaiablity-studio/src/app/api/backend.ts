export const getIncidents = () => fetch("http://localhost:9000/api/incidents").then(r => r.json());
export const getSLO = () => fetch("http://localhost:9000/api/slo").then(r => r.json());
export const getK8s = () => fetch("http://localhost:9000/api/k8s").then(r => r.json());
