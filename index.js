const express = require("express");
const url = require("url");
const client = require("prom-client");

const app = express();

app.use(express.json());

// Create a Registry which registers the metrics
const register = new client.Registry();

// Add a default label which is added to all metrics
register.setDefaultLabels({
  app: "API-NODE",
});

// Enable the collection of default metrics
client.collectDefaultMetrics({ register });

// Create a histogram metric
const httpRequestDurationMicroseconds = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in microseconds",
  labelNames: ["method", "route", "code"],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
});

// Register the histogram
register.registerMetric(httpRequestDurationMicroseconds);

app.use((req, res, next) => {
  next();
});

app.get("/", async (req, res) => {
  try {
    const end = httpRequestDurationMicroseconds.startTimer();
    const route = url.parse(req.url).pathname;
    await new Promise((resolve) =>
      setTimeout(() => {
        resolve();
      }, 1000)
    );

    end({ route, code: res.statusCode, method: req.method });

    return res.json({ route, code: res.statusCode, method: req.method });
  } catch (error) {
    console.log(error);
    return res.end();
  }
});

app.get("/metrics", async (req, res) => {
  try {
    res.setHeader("Content-Type", register.contentType);
    res.send(await register.metrics());
  } catch (error) {
    console.log(error);
    return res.end();
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});
