package services

func QueryMetrics(query string) string {
  url := "http://localhost:9090/api/v1/query?query=" + query
  resp, _ := http.Get(url)
  body, _ := io.ReadAll(resp.Body)
  return string(body)
}
