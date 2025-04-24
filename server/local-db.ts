/**
 * Utility functions for testing local database connections
 * Used during development with VS Code
 */

import { Pool } from 'pg';

/**
 * Tests the connection to the local PostgreSQL database
 * Useful for verifying that the connection details are correct
 * 
 * @returns A promise that resolves with connection info
 */
export async function testConnection() {
  console.log('Testing database connection...');
  
  // Get connection string from environment
  const connectionString = process.env.DATABASE_URL || 
    'postgresql://postgres:postgres@localhost:5432/ctx_software';
  
  try {
    // Create a new client
    const pool = new Pool({ connectionString });
    
    // Test the connection with a simple query
    const client = await pool.connect();
    const result = await client.query('SELECT version()');
    const version = result.rows[0].version;
    client.release();
    
    // Close the pool
    await pool.end();
    
    console.log('Database connection successful!');
    console.log(`PostgreSQL version: ${version.split(',')[0]}`);
    console.log(`Connection: ${connectionString.replace(/:[^:]*@/, ':******@')}`);
    
    return {
      success: true,
      version,
      connectionString: connectionString.replace(/:[^:]*@/, ':******@')
    };
  } catch (error) {
    const err = error as Error;
    console.error('❌ Database connection error:', err);
    
    return {
      success: false,
      error: err.message,
      connectionString: connectionString.replace(/:[^:]*@/, ':******@')
    };
  }
}

// When this file is run directly (not imported)
if (require.main === module) {
  testConnection()
    .then(result => {
      if (!result.success) {
        process.exit(1);
      }
    })
    .catch(err => {
      console.error('Unhandled error during connection test:', err);
      process.exit(1);
    });
}