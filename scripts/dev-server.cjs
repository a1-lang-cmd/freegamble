const path = require("path");
const { PHASE_DEVELOPMENT_SERVER } = require("next/constants");
const { setGlobal } = require("next/dist/trace/shared");
const { startServer } = require("next/dist/server/lib/start-server");

process.env.NODE_ENV = process.env.NODE_ENV || "development";

const args = process.argv.slice(2);
const portFlagIndex = args.findIndex((arg) => arg === "-p" || arg === "--port");
const portFromFlag = portFlagIndex >= 0 ? Number(args[portFlagIndex + 1]) : undefined;
const portFromInline = args
  .map((arg) => {
    const match = arg.match(/^--port=(\d+)$/);
    return match ? Number(match[1]) : undefined;
  })
  .find(Boolean);

const dir = process.cwd();
const port = Number(process.env.PORT) || portFromFlag || portFromInline || 3000;
const distDir = path.join(dir, ".next");

setGlobal("phase", PHASE_DEVELOPMENT_SERVER);
setGlobal("distDir", distDir);

startServer({
  dir,
  port,
  hostname: "0.0.0.0",
  isDev: true,
  allowRetry: true,
  keepAliveTimeout: undefined
}).catch((error) => {
  console.error(error);
  process.exit(1);
});
