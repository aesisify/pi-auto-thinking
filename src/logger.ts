// Rolling-file logger. getLogger() returns the package logger writing to
// ~/.pi/agent/pi-auto-thinking/logs/<date>.log (daily rotation, 5 MB cap, keep
// 14 days). User/global scope only.
//
// ponytail: winston + winston-daily-rotate-file chosen over pino because pino's
// transport() runs in a worker thread via dynamic import(), which jiti (pi's
// extension loader) blocks. winston is CommonJS and imports cleanly under jiti.
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import { pkgUserDir } from "./paths.ts";

let logger: winston.Logger | undefined;

export function getLogger(): winston.Logger {
	if (logger) return logger;

	const dir = join(pkgUserDir(), "logs");
	mkdirSync(dir, { recursive: true });

	logger = winston.createLogger({
		level: "info",
		format: winston.format.combine(
			winston.format.timestamp(),
			winston.format.printf(
				({ timestamp, level, message, ...rest }) =>
					`${timestamp} [${level}] ${String(message)}${Object.keys(rest).length ? ` ${JSON.stringify(rest)}` : ""}`,
			),
		),
		transports: [
			new DailyRotateFile({
				filename: join(dir, "%DATE%.log"),
				datePattern: "YYYY-MM-DD",
				maxSize: "5m",
				maxFiles: "14d",
			}),
		],
	});
	return logger;
}
