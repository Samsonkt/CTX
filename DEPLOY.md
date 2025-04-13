# Deploying CTX SOFTWARE SYSTEM to Vercel

This document provides instructions for deploying the CTX SOFTWARE SYSTEM to Vercel.

## Prerequisites

Before deploying, make sure you have:

1. A [Vercel account](https://vercel.com/signup)
2. A [Neon Database](https://neon.tech) account (or another PostgreSQL provider)
3. The [Vercel CLI](https://vercel.com/docs/cli) installed (optional)

## Setup Steps

### 1. Create a PostgreSQL Database

If you don't already have a PostgreSQL database:

1. Sign up for an account at [Neon](https://neon.tech)
2. Create a new project
3. Create a new database
4. Get the connection string from the "Connection Details" section

### 2. Deploy to Vercel

#### Option 1: Deploy via Vercel Dashboard

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)
2. Log in to your Vercel account
3. Click "Add New..." → "Project"
4. Select your repository
5. Configure the following settings:
   - **Framework Preset**: Node.js
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

6. In the "Environment Variables" section, add:
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `NODE_ENV`: `production`
   - `SESSION_SECRET`: A long, random string

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
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `NODE_ENV`: `production`
   - `SESSION_SECRET`: A long, random string

5. Complete the prompts to deploy your application

### 3. After Deployment

After the initial deployment:

1. Verify the application is working correctly by visiting the provided URL
2. Set up your custom domain (if needed) through the Vercel dashboard
3. Configure automatic deployments from your Git repository

## Troubleshooting

If you encounter issues:

1. Check the Vercel deployment logs in the dashboard
2. Verify that your database connection string is correct
3. Ensure your database is accessible from Vercel's servers
4. Check that all environment variables are set correctly

## Database Migrations

The application is set up to run database migrations automatically on startup. However, if you need to manually run migrations:

1. Ensure you have the Vercel CLI installed
2. Run:
   ```
   vercel env pull
   ```

3. Then run:
   ```
   npm run db:push
   ```

## Important Notes

- Vercel's free tier has limitations for serverless functions, including execution time and memory
- For production use, consider upgrading to a paid plan
- Keep your database connection string and other sensitive information secure
- Regularly backup your database