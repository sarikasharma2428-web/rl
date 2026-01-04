from flask import Flask
import time, random, logging
from prometheus_client import Counter, Histogram, generate_latest

app = Flask(__name__)
logging.basicConfig(filename="/var/log/app.log", level=logging.INFO)

REQUESTS = Counter("http_requests_total", "Total HTTP requests")
LATENCY = Histogram("http_request_duration_seconds", "Request latency")

@app.route("/")
def home():
    REQUESTS.inc()
    with LATENCY.time():
        time.sleep(random.uniform(0.1, 0.8))
        if random.random() < 0.25:
            logging.error("Database connection timeout")
            return "error", 500
        logging.info("Request processed successfully")
        return "ok", 200

@app.route("/health")
def health():
    return "healthy", 200

@app.route("/metrics")
def metrics():
    return generate_latest()

app.run(host="0.0.0.0", port=5000)
