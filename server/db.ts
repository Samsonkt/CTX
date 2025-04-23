import * as schema from "@shared/schema";
import { Pool as PgPool } from 'pg';
import { drizzle as pgDrizzle } from 'drizzle-orm/node-postgres';
import { Pool as NeonPool, neonConfig } from '@neondatabase/serverless';
import { drizzle as neonDrizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';

// Define types for our database connections
type AnyPool = PgPool | NeonPool;
type DrizzleDB = ReturnType<typeof pgDrizzle> | ReturnType<typeof neonDrizzle>;

// Set WebSocket for Neon Database - required for serverless environments
neonConfig.webSocketConstructor = ws;

// Variables to hold our database connection objects
let connectionPool: AnyPool;
let drizzleDb: DrizzleDB;

// Determine which database connection to use based on environment
if (process.env.NODE_ENV === 'production' || process.env.VERCEL === '1') {
  // Serverless environment (like Vercel) - Use Neon Database with websockets
  console.log('Using serverless database connection (Neon)');
  
  // Make sure we have a DATABASE_URL
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL must be set for production/serverless environments",
    );
  }
  
  // Create optimized serverless connection pool
  connectionPool = new NeonPool({ 
    connectionString: process.env.DATABASE_URL,
    max: 1,
    idleTimeoutMillis: 10000
  });
  
  // Create drizzle instance with Neon driver
  drizzleDb = neonDrizzle({ client: connectionPool as NeonPool, schema });
} else {
  // Development environment (local/VS Code) - Use standard pg driver
  console.log('Using local development database connection');
  
  // Connection pooling with better settings for local development
  connectionPool = new PgPool({ 
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/ctx_software',
    max: 10 
  });
  
  // Create drizzle instance with pg driver
  drizzleDb = pgDrizzle(connectionPool as PgPool, { schema });
}

// Function to get database instance (useful for serverless environments)
function getDbInstance() {
  return { 
    pool: connectionPool, 
    db: drizzleDb 
  };
}

// Export pool, db and helper function
export const pool = connectionPool;
export const db = drizzleDb;
export { getDbInstance };