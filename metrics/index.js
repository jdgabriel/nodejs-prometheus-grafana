const client = require("prom-client");
const url = require("url");
const ResponseTime = require("response-time");
let prefix = "app_";

const { Counter, Summary, register: Register } = client;

/**
 * A Prometheus counter that counts the invocations of the different HTTP verbs
 * e.g. a GET and a POST call will be counted as 2 different calls
 */
module.exports.numOfRequests = numOfRequests = new Counter({
  name: "numOfRequests",
  help: "Number of requests made",
  labelNames: ["method"],
});

/**
 * A Prometheus counter that counts the invocations with different paths
 * e.g. /foo and /bar will be counted as 2 different paths
 */
module.exports.pathsTaken = pathsTaken = new Counter({
  name: `${prefix}_pathsTaken`,
  help: "Paths taken in the app",
  labelNames: ["path"],
});

/**
 * A Prometheus summary to record the HTTP method, path, response code and response time
 */
module.exports.responses = responses = new Summary({
  name: `${prefix}_responses`,
  help: "Duration of HTTP requests in microseconds",
  labelNames: ["method", "route", "code"],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
});

/**
 * This function increments the counters that are executed on the request side of an invocation
 * Currently it increments the counters for numOfPaths and pathsTaken
 */
module.exports.requestCounters = function (req, res, next) {
  if (req.path != "/metrics") {
    numOfRequests.inc({ method: req.method });
    pathsTaken.inc({ path: req.path });
  }
  next();
};

/**
 * This function increments the counters that are executed on the response side of an invocation
 * Currently it updates the responses summary
 */
module.exports.responseCounters = ResponseTime(function (req, res, time) {
  if (req.url != "/metrics") {
    // const route = url.parse(req.url).pathname;
    responses.labels(req.method, req.url, res.statusCode).observe(time);
    console.log(req.method, req.url, res.statusCode);
  }
});

/**
 * This function will start the collection of metrics and should be called from within in the main js file
 */
module.exports.startCollection = ({ prefix }) => {
  client.collectDefaultMetrics({ prefix });
};

/**
 * In order to have Prometheus get the data from this app a specific URL is registered
 */
module.exports.injectMetricsRoute = (App) => {
  App.get("/metrics", async (req, res) => {
    res.set("Content-Type", Register.contentType);
    res.end(await Register.metrics());
  });
};
