const express = require("express");
const Prometheus = require("./metrics");

const app = express();

app.use(express.json());

//Enable collection of default metrics
Prometheus.startCollection({ prefix: "NODE_APP_" });

app.use(Prometheus.requestCounters);
app.use(Prometheus.responseCounters);

//Enable metrics endpoint
Prometheus.injectMetricsRoute(app);

app.get("/", async (req, res) => {
  try {
    await new Promise((resolve) =>
      setTimeout(resolve, Math.floor(Math.random() * 1000))
    );

    if (req.query.error) {
      throw new Error("Unexpected error");
    }

    return res.status(200).json({ hello: "world" });
  } catch (error) {
    return res.status(400).end();
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});
