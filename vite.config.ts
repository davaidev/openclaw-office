import { resolve } from "node:path";
import { readFileSync } from "node:fs";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

const pkg = JSON.parse(readFileSync(resolve(__dirname, "package.json"), "utf-8"));

function resolveGatewayTarget(mode: string) {
  const env = loadEnv(mode, process.cwd(), "");
  return env.VITE_GATEWAY_URL || "ws://localhost:18789";
}

function toGatewayOrigin(target: string) {
  const url = new URL(target);
  const protocol = url.protocol === "wss:" ? "https:" : "http:";
  return `${protocol}//${url.host}`;
}

export default defineConfig(({ mode }) => {
  const gatewayTarget = resolveGatewayTarget(mode);
  const gatewayOrigin = toGatewayOrigin(gatewayTarget);

  return {
    define: {
      __APP_VERSION__: JSON.stringify(pkg.version),
    },
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": resolve(__dirname, "./src"),
      },
    },
    server: {
      port: 5180,
      proxy: {
        "/gateway-ws": {
          target: gatewayTarget,
          changeOrigin: true,
          ws: true,
          rewrite: (path) => path.replace(/^\/gateway-ws/, ""),
          configure(proxy) {
            proxy.on("proxyReqWs", (proxyReq) => {
              proxyReq.setHeader("Origin", gatewayOrigin);
            });
          },
        },
      },
    },
  };
});
