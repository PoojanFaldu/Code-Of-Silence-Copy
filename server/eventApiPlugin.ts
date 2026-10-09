import fs from "fs";
import path from "path";
import type { Plugin, PreviewServer, ViteDevServer } from "vite";

type PlayerRecord = {
  id: string;
  name: string;
  puzzlesPassed: number;
  completedTaskIds: string[];
  murderGuess: string;
  murderGuessName: string | null;
  timeUsedSeconds: number | null;
  timedOut: boolean;
  startedAt: string | null;
  finishedAt: string | null;
  status: string;
};

type EventDb = { players: PlayerRecord[] };

function dataPath(root: string) {
  return path.join(root, "data", "event-db.json");
}

function ensureDb(root: string): EventDb {
  const file = dataPath(root);
  const dir = path.dirname(file);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(file)) {
    const empty: EventDb = { players: [] };
    fs.writeFileSync(file, JSON.stringify(empty, null, 2), "utf8");
    return empty;
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(file, "utf8")) as EventDb;
    return { players: Array.isArray(parsed.players) ? parsed.players : [] };
  } catch {
    return { players: [] };
  }
}

function writeDb(root: string, db: EventDb) {
  const file = dataPath(root);
  const dir = path.dirname(file);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(file, JSON.stringify(db, null, 2), "utf8");
}

function readBody(req: import("http").IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (c) => chunks.push(Buffer.from(c)));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function adminPassword() {
  return (
    process.env.ADMIN_PASSWORD?.trim() ||
    process.env.VITE_ADMIN_PASSWORD?.trim() ||
    "2345"
  );
}

function attachApi(server: ViteDevServer | PreviewServer, root: string) {
  server.middlewares.use(async (req, res, next) => {
    const url = req.url?.split("?")[0] ?? "";

    if (url === "/api/event-db" && req.method === "GET") {
      const db = ensureDb(root);
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(db));
      return;
    }

    if (url === "/api/event-db" && req.method === "POST") {
      try {
        const raw = await readBody(req);
        const incoming = JSON.parse(raw) as EventDb;
        const players = Array.isArray(incoming.players) ? incoming.players : [];
        writeDb(root, { players });
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ ok: true, count: players.length }));
      } catch {
        res.statusCode = 400;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ ok: false, error: "Invalid payload" }));
      }
      return;
    }

    if (url === "/api/admin/verify" && req.method === "POST") {
      try {
        const raw = await readBody(req);
        const body = JSON.parse(raw) as { password?: string };
        const ok = (body.password ?? "") === adminPassword();
        res.statusCode = ok ? 200 : 401;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ ok }));
      } catch {
        res.statusCode = 400;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ ok: false }));
      }
      return;
    }

    next();
  });
}

/** Disk-backed event DB + admin verify — survives Vite/server restarts. */
export function eventApiPlugin(): Plugin {
  return {
    name: "cos-event-api",
    configureServer(server) {
      attachApi(server, server.config.root);
    },
    configurePreviewServer(server) {
      attachApi(server, server.config.root);
    },
  };
}
