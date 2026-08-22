import mongoose from "mongoose";
import { env } from "../config/env.js";
import { logger } from "../lib/logger.js";

/**
 * Wraps the single Mongoose connection this process holds. A singleton (one
 * instance, exported below) because there's exactly one connection for the app's
 * lifetime — `getInstance()` exists for symmetry with the pattern, not because a
 * second instance would ever legitimately be created.
 */
export class Database {
  private static instance: Database;

  private constructor() {}

  static getInstance(): Database {
    if (!Database.instance) Database.instance = new Database();
    return Database.instance;
  }

  async connect(): Promise<void> {
    if (mongoose.connection.readyState === 1) return;
    await mongoose.connect(env.MONGODB_URI, { dbName: env.MONGODB_DB_NAME });
    logger.info({ dbName: env.MONGODB_DB_NAME }, "connected to MongoDB");
  }

  async disconnect(): Promise<void> {
    await mongoose.disconnect();
  }
}

export const database = Database.getInstance();
