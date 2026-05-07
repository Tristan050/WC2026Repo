import { createServer } from "node:http";

export function startWsGateway(port = 3010) {
  const server = createServer((_, res) => {
    res.statusCode = 200;
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ ok: true, service: "ws-gateway-stub" }));
  });

  server.listen(port, () => {
    console.log(`ws gateway stub on :${port}`);
  });

  return server;
}
