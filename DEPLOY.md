# Deploying CTX SOFTWARE SYSTEM to Vercel

This document provides instructions for deploying the CTX SOFTWARE SYSTEM to Vercel with Neon PostgreSQL database integration.

## Prerequisites

Before deploying, make sure you have:

1. A [Vercel account](https://vercel.com/signup)
2. A [Neon Database](https://neon.tech) account (Neon is available as an integration in Vercel)

## Setup Steps

### 1. Prepare Your Neon Database

#### Option 1: Using Vercel Integration (Recommended)

1. Log in to your Vercel account
2. Go to your dashboard and click on "Integrations"
3. Search for "Neon" and select it
4. Click "Add Integration" and follow the prompts to connect your Vercel account to Neon
5. During project deployment, you'll be able to select this integration

#### Option 2: Create a Neon Database Manually

1. Sign up for an account at [Neon](https://neon.tech)
2. Create a new project
3. Create a new database
4. From the "Connection Details" section, copy the Postgres connection string
5. Make sure the connection string includes the database name, username, and password

### 2. Deploy to Vercel

#### Option 1: Deploy via Vercel Dashboard (Recommended)

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)
2. Log in to your Vercel account
3. Click "Add New..." → "Project"
4. Select your repository
5. Configure the following settings:
   - **Framework Preset**: Node.js
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

6. In the "Environment Variables" section:
   - If using Neon integration: The `DATABASE_URL` variable will be automatically added
   - If not using integration, add manually:
     - `DATABASE_URL`: Your Neon PostgreSQL connection string
   - Add these additional variables:
     - `NODE_ENV`: `production`
     - `SESSION_SECRET`: A long, random string (at least 32 characters)

7. Click "Deploy"

#### Option 2: Deploy via Vercel CLI

1. Install the Vercel CLI:
   ```
   npm i -g vercel
   ```

2. Log in to Vercel:
   ```
   vercel login
   ```

3. From the project root directory, run:
   ```
   vercel
   ```

4. When prompted, set these environment variables:
   - `DATABASE_URL`: Your Neon PostgreSQL connection string
   - `NODE_ENV`: `production`
   - `SESSION_SECRET`: A long, random string (at least 32 characters)

5. Complete the prompts to deploy your application

### 3. Initialize the Database Schema

After deployment, you'll need to initialize your database schema:

1. Install the Vercel CLI (if not already installed)
2. Log in to Vercel:
   ```
   vercel login
   ```

3. Link your local project to the Vercel project:
   ```
   vercel link
   ```

4. Pull the environment variables:
   ```
   vercel env pull
   ```

5. Run database migration:
   ```
   npm run db:push
   ```

### 4. Post-Deployment Steps

1. Verify the application is working by visiting the provided URL
2. Create an initial admin user account
3. Set up your custom domain (if needed) through the Vercel dashboard
4. Configure automatic deployments from your Git repository

## Important Neon-Specific Notes

1. **Serverless Optimization**: The application is already configured to use Neon's serverless driver with websocket connections
2. **Connection Pooling**: For production use, enable Neon's connection pooling to improve performance
3. **Database Branching**: You can use Neon's database branching feature for development/staging environments

## Troubleshooting

If you encounter issues:

1. Check the Vercel deployment logs in the dashboard
2. Verify that your Neon database connection string is correct:
   - The format should be: `postgres://user:password@host:port/database`
   - Make sure it includes the `?sslmode=require` parameter
3. Ensure your IP is not being blocked by any Neon access control settings
4. Check that your environment variables are properly set

## Security Recommendations

- Neon databases are secure by default, but consider enabling IP allow-listing for an extra layer of security
- Regularly rotate the SESSION_SECRET value
- Create database users with appropriate permissions
- Enable Neon's audit logging for monitoring database activity

## Scaling Considerations

- Neon offers autoscaling compute resources - consider enabling this for production use
- For high-traffic applications, upgrade your Neon plan to ensure adequate database performance
- Use the Vercel Analytics to monitor your application's performance