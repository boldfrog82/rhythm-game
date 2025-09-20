import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const OUTPUT_URL = new URL("../public/audio/demo.mp3", import.meta.url);
const OUTPUT_PATH = fileURLToPath(OUTPUT_URL);
const OUTPUT_DIR = dirname(OUTPUT_PATH);

const BASE64_SEGMENTS = [
  "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",
  "MTAwqqqqqqqqqv/7EMTwAMNwHWHH4YDoX4OsOYg8xKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq",
  "qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqTEFNRTMuMTAwqqqqqqqqqqqq",
  "//sQxPAAw2QdYcfhgOhiA+x497Akqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq",
  "qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqr/+xDE8ADDfB1f",
  "x+MAKF8D7LjHsCSqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq",
  "qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqv/7EMTwgMN4HV/H4wBoYwPsuPe8",
  "TKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq",
  "qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//tAxP+AA2gdYdWAACodEmr/O5CIqqqqqqqqqqqq",
  "qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq",
  "qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq",
  "qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqr/+xDE1gPAAAH+HAAAIAAANIAA",
  "AASqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq",
  "qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqg==",
];

const BASE64 = BASE64_SEGMENTS.join("");
const BUFFER = Buffer.from(BASE64, "base64");

mkdirSync(OUTPUT_DIR, { recursive: true });

let shouldWrite = true;
try {
  const existing = readFileSync(OUTPUT_PATH);
  if (existing.equals(BUFFER)) {
    shouldWrite = false;
  }
} catch (error) {
  if (error.code !== "ENOENT") {
    throw error;
  }
}

if (shouldWrite) {
  writeFileSync(OUTPUT_PATH, BUFFER);
}
