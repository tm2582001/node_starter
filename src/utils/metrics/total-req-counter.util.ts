import client from "prom-client";

const totalReqCounter = new client.Counter({
  name: "http_requests_total", // metric name
  help: "Total number of HTTP requests", // description
});

export default totalReqCounter;
