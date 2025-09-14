import { pino } from "pino";

const isDev = process.env["NODE_ENV"] !== "production";

const loggerConfig = isDev
	? {
			level: process.env["LOG_LEVEL"] || "info",
			transport: {
				target: "pino-pretty",
				options: {
					colorize: true,
				},
			},
	  }
	: {
			level: process.env["LOG_LEVEL"] || "info",
	  };

export const logger = pino(loggerConfig);
