import { spawn } from "node:child_process";
spawn("npm", ["run", "start"], {
  shell: true,
  stdio: "inherit",
  env: {
    ...process.env,
    WS_GATEWAY_WS_ADDRESS: "wss://frag.jetzt/gateway/ws/websocket",
    WS_GATEWAY_WS_REWRITE: "^/gateway/ws/websocket",
    WS_GATEWAY_WS_ORIGIN: "https://frag.jetzt",
    WS_GATEWAY_HTTP_ADDRESS: "https://frag.jetzt/gateway-api",
    WS_GATEWAY_HTTP_REWRITE: "^/gateway-api",
    BACKEND_ADDRESS: "https://frag.jetzt/api",
    BACKEND_SECURE: "true",
    BACKEND_CHANGE_ORIGIN: "true",
  },
});
