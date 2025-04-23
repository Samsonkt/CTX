#!/usr/bin/env node

/**
 * Local Database Initialization Script for CTX Software System
 * 
 * This script helps developers set up a local PostgreSQL database for development
 * with VS Code. Run this script once to create the database and tables.
 * 
 * Usage: 
 *   node scripts/init-local-db.js
 * 
 * Prerequisites:
 *   - PostgreSQL installed and running locally
 *   - Default postgres user with password 'postgres'
 *   - Update the values below if your setup is different
 */

const { Client } = require('pg');
const { exec } = require('child_process');
const readline = require('readline');
const { promisify } = require('util');
const execPromise = promisify(exec);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Default configuration - adjust as needed
const config = {
  user: 'postgres',
  password: 'postgres',
  host: 'localhost',
  port: 5432,
  database: 'postgres' // Initial connection to postgres database
};

const DB_NAME = 'ctx_software';

async function initializeDatabase() {
  console.log('\n🔧 CTX SOFTWARE SYSTEM - Local Database Setup\n');
  
  try {
    // 1. Connect to postgres database
    const client = new Client(config);
    await client.connect();
    console.log('✅ Connected to PostgreSQL');
    
    // 2. Check if our database already exists
    const { rows } = await client.query(
      "SELECT EXISTS(SELECT 1 FROM pg_database WHERE datname = $1) as exists",
      [DB_NAME]
    );
    
    // 3. Create database if it doesn't exist
    if (!rows[0].exists) {
      console.log(`Creating database: ${DB_NAME}...`);
      await client.query(`CREATE DATABASE ${DB_NAME}`);
      console.log(`✅ Database "${DB_NAME}" created successfully`);
    } else {
      console.log(`ℹ️ Database "${DB_NAME}" already exists`);
    }
    
    // 4. Close initial connection
    await client.end();
    
    console.log('\n🚀 Running database migrations...');
    
    // 5. Run Drizzle migrations to set up schema
    try {
      await execPromise('npm run db:push');
      console.log('✅ Database schema created successfully');
    } catch (error) {
      console.error('❌ Error running database migrations:', error.message);
      console.log('You may need to run the migrations manually with: npm run db:push');
    }
    
    // 6. Show connection string
    console.log('\n🔑 Connection Information:');
    console.log(`DATABASE_URL=postgresql://${config.user}:${config.password}@${config.host}:${config.port}/${DB_NAME}`);
    
    console.log('\n✨ Setup complete! You can now start developing with VS Code.');
    console.log('📝 Make sure to update your .env file with the connection string above.');
    
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n🔴 Could not connect to PostgreSQL. Please ensure that:');
      console.log('  1. PostgreSQL is installed and running');
      console.log('  2. The connection details in this script are correct');
      console.log('  3. The postgres user has the necessary permissions');
    }
  }
  
  rl.close();
}

// Run the function
initializeDatabase();