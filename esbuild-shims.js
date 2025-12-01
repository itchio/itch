// Polyfills for Node.js APIs in browser environment
import { Buffer } from "buffer";
import process from "process/browser";

globalThis.Buffer = Buffer;
globalThis.process = process;
