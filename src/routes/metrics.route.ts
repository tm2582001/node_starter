import type { Request, Response } from "express";
import client from "prom-client";

const metrics = async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) return res.status(401).send("unauthorized");

  const [method, token] = authHeader.split(" ");

  const accessToken = req.config.logs.lokiEndpointToken;

  if (!accessToken) return res.status(503).send("Metrics endpoint disabled");

  if (method !== "Bearer" || token !== accessToken) {
    return res.status(401).send("unauthorized");
  }

  res.setHeader("Content-Type", client.register.contentType);
  const metrics = await client.register.metrics();
  return res.send(metrics);
};

export default metrics;
