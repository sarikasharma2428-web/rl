package services

func QueryLogs(query string) string {
  url := "http://localhost:3100/loki/api/v1/query?query=" + query
  resp, _ := http.Get(url)
  body, _ := io.ReadAll(resp.Body)
  return string(body)
}

