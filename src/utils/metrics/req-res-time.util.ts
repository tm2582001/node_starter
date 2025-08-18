import client from 'prom-client';

const reqResponseTime = new client.Histogram({
  name: 'http_express_req_res_time',
  help: 'This tells how much time is taken by req and res',
  labelNames: ['method', 'route', 'statusCode'],
  buckets: [1, 50, 100, 200, 400, 500, 800, 1000, 2000],
});

export default reqResponseTime;
