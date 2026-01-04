package services

func GetTraces() string {
  resp, _ := http.Get("http://localhost:3200/api/search")
  body, _ := io.ReadAll(resp.Body)
  return string(body)
}
