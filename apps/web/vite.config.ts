import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

/**
 * 로컬 개발용: `pnpm dev` 하나로 api/*.ts (Vercel Functions)도 같이 실행.
 * 배포 시에는 Vercel이 api/ 폴더를 서버리스 함수로 자동 배포하므로 이 플러그인은 쓰이지 않음.
 */
function vercelApiDev(): Plugin {
  return {
    name: "vercel-api-dev",
    configureServer(server) {
      server.middlewares.use("/api", async (req, res, next) => {
        try {
          const url = new URL(req.originalUrl ?? req.url ?? "/", "http://localhost");
          const name = url.pathname.replace(/^\/api\/?/, "").replace(/\/$/, "") || "index";
          const mod = await server.ssrLoadModule(`/api/${name}.ts`).catch(() => null);
          const handler = mod?.[req.method ?? "GET"];
          if (typeof handler !== "function") return next();

          const chunks: Buffer[] = [];
          for await (const chunk of req) chunks.push(chunk as Buffer);
          const hasBody = !["GET", "HEAD"].includes(req.method ?? "GET");
          const request = new Request(url, {
            method: req.method,
            headers: req.headers as Record<string, string>,
            body: hasBody ? Buffer.concat(chunks) : undefined,
          });

          const response: Response = await handler(request);
          res.statusCode = response.status;
          response.headers.forEach((v, k) => res.setHeader(k, v));
          res.end(Buffer.from(await response.arrayBuffer()));
        } catch (err) {
          server.config.logger.error(String(err));
          res.statusCode = 500;
          res.end("API error");
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), vercelApiDev()],
  server: { host: true },
});
