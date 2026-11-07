type Level = "info" | "warn" | "error";

function emit(level: Level, msg: string, fields: Record<string, unknown> = {}) {
  const line = JSON.stringify({
    level,
    msg,
    time: new Date().toISOString(),
    ...fields,
  });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const logger = {
  info: (msg: string, f?: Record<string, unknown>) => emit("info", msg, f),
  warn: (msg: string, f?: Record<string, unknown>) => emit("warn", msg, f),
  error: (msg: string, f?: Record<string, unknown>) => emit("error", msg, f),
};

export function withLogging<Req extends Request, A extends unknown[]>(
  name: string,
  handler: (req: Req, ...args: A) => Promise<Response>,
) {
  return async (req: Req, ...args: A): Promise<Response> => {
    const start = Date.now();
    const requestId = crypto.randomUUID();
    try {
      const res = await handler(req, ...args);
      const durationMs = Date.now() - start;
      emit(durationMs > 1000 ? "warn" : "info", "request", {
        route: name,
        method: req.method,
        status: res.status,
        durationMs,
        requestId,
      });
      return res;
    } catch (err) {
      emit("error", "request_failed", {
        route: name,
        method: req.method,
        durationMs: Date.now() - start,
        requestId,
        error: err instanceof Error ? err.message : String(err),
      });
      throw err;
    }
  };
}
