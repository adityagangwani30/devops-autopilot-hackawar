import http from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";

const targetDirArg = process.argv[2] ?? "frontend/out";
const portArg = process.argv[3] ?? process.env.PORT ?? "3000";
const rootDir = resolve(process.cwd(), targetDirArg);
const port = Number.parseInt(portArg, 10);

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpg": "image/jpeg",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp"
};

if (!existsSync(rootDir)) {
  console.error(`Static directory not found: ${rootDir}`);
  console.error("Run `npm run build:frontend` first.");
  process.exit(1);
}

const resolveRequestPath = requestUrl => {
  const pathname = decodeURIComponent(new URL(requestUrl, "http://localhost").pathname);
  const safePath = normalize(pathname).replace(/^(\.\.(\/|\\|$))+/, "");
  const absolutePath = join(rootDir, safePath);

  const candidates = [
    absolutePath,
    `${absolutePath}.html`,
    join(absolutePath, "index.html")
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate) && statSync(candidate).isFile()) {
      return candidate;
    }
  }

  return join(rootDir, "404.html");
};

const server = http.createServer((request, response) => {
  const filePath = resolveRequestPath(request.url ?? "/");

  if (!existsSync(filePath)) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }

  const extension = extname(filePath);
  response.writeHead(filePath.endsWith("404.html") ? 404 : 200, {
    "Content-Type": mimeTypes[extension] ?? "application/octet-stream"
  });

  createReadStream(filePath).pipe(response);
});

server.listen(port, () => {
  console.log(`Static site available at http://localhost:${port}`);
  console.log(`Serving files from ${rootDir}`);
});
