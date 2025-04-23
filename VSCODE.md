# Running CTX SOFTWARE SYSTEM in VS Code

This guide provides instructions for setting up and running the CTX SOFTWARE SYSTEM in Visual Studio Code.

## Prerequisites

1. [Visual Studio Code](https://code.visualstudio.com/) installed
2. [Node.js](https://nodejs.org/) (v16 or higher) installed
3. [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/) installed
4. [Git](https://git-scm.com/) installed
5. PostgreSQL database (local or cloud-based)

## Recommended VS Code Extensions

For the best development experience, install these VS Code extensions:

1. **ESLint** - For JavaScript linting
2. **Prettier** - For code formatting
3. **TypeScript Extension Pack** - Enhanced TypeScript support
4. **Tailwind CSS IntelliSense** - For Tailwind CSS auto-completion
5. **DotENV** - For .env file syntax highlighting
6. **vscode-icons** - For better file icons

## Setup Steps

1. Clone the repository (if you haven't already):
   ```bash
   git clone <repository-url>
   cd ctx-software-system
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Setup the local PostgreSQL database:
   
   **Option A: Using the setup script (recommended)**
   
   We've included a database initialization script that will create the local database and run migrations:
   
   ```bash
   node scripts/init-local-db.js
   ```
   
   This script will:
   - Create a PostgreSQL database named 'ctx_software'
   - Run the database migrations
   - Display the connection string to use in your .env file
   
   **Option B: Manual setup**
   
   If you prefer to set up manually:
   - Create a PostgreSQL database (e.g., 'ctx_software')
   - Run the migrations with `npm run db:push`

4. Create a `.env` file in the project root with the following content:
   ```
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ctx_software
   NODE_ENV=development
   SESSION_SECRET=your-session-secret
   PORT=5000
   ```
   
   Replace the `DATABASE_URL` if your connection details are different from the defaults.

5. Open the project in VS Code:
   ```bash
   code .
   ```

## Running the Application

### Option 1: Using VS Code Debugger

1. Open the VS Code debugger tab (Ctrl+Shift+D or Cmd+Shift+D on Mac)
2. Select "Launch Server" from the dropdown
3. Click the green play button

### Option 2: Using Terminal

1. Open the terminal in VS Code (Ctrl+` or View > Terminal)
2. Run the development server:
   ```bash
   npm run dev
   ```

The application will start and be available at http://localhost:5000

## Debugging

The VS Code launch configuration is set up to:
- Run the server in debug mode
- Enable breakpoints
- Show console output in the VS Code integrated terminal

To set a breakpoint:
1. Click in the gutter (to the left of the line number) in any source file
2. A red dot will appear, indicating a breakpoint
3. When code execution reaches that line, it will pause

## Troubleshooting

### Database Connection Issues

If you encounter database connection errors:

1. Verify your PostgreSQL service is running
2. Check that your DATABASE_URL is correct in the .env file
3. Ensure no firewall is blocking the PostgreSQL port
4. Try connecting to the database using a different client to verify credentials

### Node.js or npm Issues

If you encounter Node.js or npm related errors:

1. Verify Node.js version: `node -v` (should be v16+)
2. Clear npm cache: `npm cache clean --force`
3. Delete node_modules and reinstall: `rm -rf node_modules && npm install`

### WebSocket Connection Issues with Neon Database

If using Neon database and encountering WebSocket issues:

1. Ensure @neondatabase/serverless package is installed
2. Check that the WebSocket connection is properly configured in server/db.ts
3. Make sure your firewall isn't blocking WebSocket connections

## Development Workflow

1. Make changes to the code
2. VS Code will auto-compile TypeScript files
3. The development server will automatically restart when server files change
4. The client will hot-reload when client files change
5. Check the terminal for any error messages

## Extending the Application

When extending the application:

1. Add new models to shared/schema.ts
2. Implement storage operations in server/storage.ts
3. Add API routes in server/routes.ts
4. Create UI components in client/src/components
5. Add new pages in client/src/pages
6. Update the router in client/src/App.tsx