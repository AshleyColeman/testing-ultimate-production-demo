/**
 * 📝 Logger - Production-Grade Logging Utility
 *
 * Features:
 * - Multiple log levels with beautiful colors
 * - Human-friendly console output
 * - File logging support
 * - Structured logging
 * - Performance tracking
 * - Progress indicators
 */

import winston from "winston";
import chalk from "chalk";
import fs from "fs";
import path from "path";

const { combine, timestamp, printf } = winston.format;

// Human-friendly console format with colors
const consoleFormat = printf(({ level, message, timestamp, ...metadata }) => {
  const time = chalk.gray(timestamp);
  let levelIcon = "";
  let levelColor = chalk.white;

  switch (level) {
    case "info":
      levelIcon = "ℹ️";
      levelColor = chalk.blue;
      break;
    case "warn":
      levelIcon = "⚠️";
      levelColor = chalk.yellow;
      break;
    case "error":
      levelIcon = "❌";
      levelColor = chalk.red;
      break;
    case "debug":
      levelIcon = "🐛";
      levelColor = chalk.magenta;
      break;
  }

  let msg = `${time} ${levelIcon} ${levelColor(message)}`;

  if (
    Object.keys(metadata).length > 0 &&
    metadata.service !== "TestInfrastructure"
  ) {
    const metaStr = JSON.stringify(metadata, null, 2);
    msg += chalk.gray(`\n  ${metaStr}`);
  }

  return msg;
});

// File format (JSON for parsing)
const fileFormat = printf(({ level, message, timestamp, ...metadata }) => {
  return JSON.stringify({ timestamp, level, message, ...metadata });
});

// Human-readable file format
const humanFileFormat = printf(({ level, message, timestamp, ...metadata }) => {
  const levelUpper = level.toUpperCase().padEnd(5);
  let msg = `[${timestamp}] ${levelUpper} ${message}`;

  if (
    Object.keys(metadata).length > 0 &&
    metadata.service !== "TestInfrastructure"
  ) {
    msg += `\n  ${JSON.stringify(metadata, null, 2)}`;
  }

  return msg;
});

export function createLogger(
  service: string = "App",
  logFile?: string
): winston.Logger {
  const transports: winston.transport[] = [
    new winston.transports.Console({
      format: combine(
        timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        consoleFormat
      ),
    }),
  ];

  if (logFile) {
    // Ensure log directory exists
    const logDir = path.dirname(logFile);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    // JSON format for parsing (combined.log)
    transports.push(
      new winston.transports.File({
        filename: logFile,
        format: combine(timestamp(), fileFormat),
      })
    );

    // Human-readable format (demo.log)
    const humanLogFile = logFile.replace("combined.log", "demo.log");
    transports.push(
      new winston.transports.File({
        filename: humanLogFile,
        format: combine(
          timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
          humanFileFormat
        ),
      })
    );
  }

  return winston.createLogger({
    level: process.env.LOG_LEVEL || "info",
    defaultMeta: { service },
    transports,
  });
}
export class Logger {
  private logger: winston.Logger;
  private service: string;

  constructor(service: string = "App", logFile?: string) {
    this.service = service;
    this.logger = createLogger(service, logFile);
  }

  info(message: string, meta?: any): void {
    this.logger.info(message, meta);
  }

  warn(message: string, meta?: any): void {
    this.logger.warn(message, meta);
  }

  error(message: string, meta?: any): void {
    this.logger.error(message, meta);
  }

  debug(message: string, meta?: any): void {
    this.logger.debug(message, meta);
  }

  success(message: string, meta?: any): void {
    console.log(
      chalk.green(`✅ ${message}`),
      meta ? chalk.gray(JSON.stringify(meta, null, 2)) : ""
    );
  }

  step(message: string, meta?: any): void {
    console.log(
      chalk.cyan(`➤ ${message}`),
      meta ? chalk.gray(JSON.stringify(meta, null, 2)) : ""
    );
  }

  heading(message: string): void {
    console.log(chalk.cyan.bold(`\n${"=".repeat(60)}`));
    console.log(chalk.cyan.bold(`  ${message}`));
    console.log(chalk.cyan.bold(`${"=".repeat(60)}\n`));
  }

  subheading(message: string): void {
    console.log(chalk.yellow.bold(`\n${message}`));
    console.log(chalk.yellow(`${"─".repeat(message.length)}`));
  }

  metric(label: string, value: string | number, unit: string = ""): void {
    console.log(
      chalk.gray(`  ${label}:`),
      chalk.white.bold(`${value}${unit ? " " + unit : ""}`)
    );
  }

  progress(current: number, total: number, message: string = ""): void {
    const percentage = Math.round((current / total) * 100);
    const barLength = 30;
    const filledLength = Math.round((barLength * current) / total);
    const bar = "█".repeat(filledLength) + "░".repeat(barLength - filledLength);

    process.stdout.write(
      `\r${chalk.cyan("⏳")} ${chalk.white(message)} ${chalk.yellow(
        bar
      )} ${chalk.bold(`${percentage}%`)} (${current}/${total})`
    );

    if (current === total) {
      console.log(); // New line when complete
    }
  }

  table(data: Array<{ [key: string]: any }>): void {
    if (data.length === 0) return;

    const keys = Object.keys(data[0]);
    const maxWidths = keys.map((key) => {
      const values = data.map((row) => String(row[key] || "").length);
      return Math.max(key.length, ...values) + 2;
    });

    // Header
    const header = keys.map((key, i) => key.padEnd(maxWidths[i])).join(" | ");
    console.log(chalk.cyan.bold(header));
    console.log(chalk.gray("─".repeat(header.length)));

    // Rows
    data.forEach((row) => {
      const rowStr = keys
        .map((key, i) => String(row[key] || "").padEnd(maxWidths[i]))
        .join(" | ");
      console.log(chalk.white(rowStr));
    });
    console.log();
  }

  box(title: string, content: string[]): void {
    const maxLength = Math.max(title.length, ...content.map((c) => c.length));
    const width = maxLength + 4;

    console.log(chalk.cyan("┌" + "─".repeat(width) + "┐"));
    console.log(
      chalk.cyan("│ ") +
        chalk.bold(title.padEnd(maxLength + 2)) +
        chalk.cyan("│")
    );
    console.log(chalk.cyan("├" + "─".repeat(width) + "┤"));

    content.forEach((line) => {
      console.log(
        chalk.cyan("│ ") + line.padEnd(maxLength + 2) + chalk.cyan("│")
      );
    });

    console.log(chalk.cyan("└" + "─".repeat(width) + "┘\n"));
  }

  separator(): void {
    console.log(chalk.gray("─".repeat(60)));
  }

  newline(): void {
    console.log();
  }
}

export default Logger;
