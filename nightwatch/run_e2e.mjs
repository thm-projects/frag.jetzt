import { spawn } from "child_process";

const angularProcess = spawn("bunx", ["ng", "serve", "--port", "4200"], {
  env: {
    ...process.env,
    WS_GATEWAY_WS_ADDRESS: "wss://staging.frag.jetzt/gateway/ws/websocket",
    WS_GATEWAY_WS_REWRITE: "^/gateway/ws/websocket",
    WS_GATEWAY_WS_ORIGIN: "https://staging.frag.jetzt",
    WS_GATEWAY_HTTP_ADDRESS: "https://staging.frag.jetzt/gateway-api",
    WS_GATEWAY_HTTP_REWRITE: "^/gateway-api",
    BACKEND_ADDRESS: "https://staging.frag.jetzt/api",
    BACKEND_SECURE: "true",
    BACKEND_CHANGE_ORIGIN: "true",
    AI_ADDRESS: "https://staging.frag.jetzt/ai",
    AI_SECURE: "true",
    AI_CHANGE_ORIGIN: "true",
  },
});

const startNightwatch = () => {
  console.log("App is ready. Running Nightwatch tests...");
  // Run Nightwatch tests
  const nightwatchProcess = spawn("bunx", ["ng", "e2e"], {
    stdio: "inherit",
    shell: true,
  });

  nightwatchProcess.on("close", (code) => {
    console.log(`Nightwatch tests finished with code ${code}`);
    angularProcess.kill();
    process.exit(code);
  });
};

angularProcess.on("close", (code) => {
  console.error(`Angular app exited with code ${code}`);
  process.exit(code);
});

let started = false;
angularProcess.stdout.on("data", (data) => {
  const message = data.toString();
  if (
    !started &&
    message
      .split("\n")
      .some((x) => x.startsWith("Application bundle generation complete."))
  ) {
    started = true;
    startNightwatch();
  }
});

angularProcess.stderr.on("data", (data) => {
  const message = data.toString();
  console.error(message);
});
