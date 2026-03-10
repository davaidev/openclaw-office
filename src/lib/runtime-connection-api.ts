import type { ConnectionMode } from "@/lib/connection-preferences";

const RUNTIME_CONNECTION_API_PATH = "/__openclaw/connection";

function getRuntimeConnectionUrl(): string {
  const injected = (window as unknown as Record<string, unknown>).__OPENCLAW_CONFIG__ as
    | { basePath?: string }
    | undefined;
  const base = injected?.basePath || "";
  return base ? `${base}${RUNTIME_CONNECTION_API_PATH}` : RUNTIME_CONNECTION_API_PATH;
}

interface RuntimeConnectionRequest {
  mode: ConnectionMode;
  gatewayUrl?: string;
}

export async function updateRuntimeConnectionTarget(payload: RuntimeConnectionRequest) {
  const response = await fetch(getRuntimeConnectionUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Runtime connection update failed: ${response.status}`);
  }
}
