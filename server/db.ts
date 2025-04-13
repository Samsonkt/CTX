import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Set WebSocket for Neon Database - required for serverless environments
neonConfig.webSocketConstructor = ws;

// Make sure we have a DATABASE_URL
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Create database connection pool
const connectionPool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  // Optimize connection pooling for serverless
  max: 1,
  // Don't keep connections open for too long
  idleTimeoutMillis: 10000
});

// Create drizzle instance
const drizzleDb = drizzle({ client: connectionPool, schema });

// Function to get a database instance (useful for serverless environments)
function getDbInstance() {
  return { 
    pool: connectionPool, 
    db: drizzleDb
  };
}

// Export pool and db
export { connectionPool as pool, drizzleDb as db, getDbInstance };