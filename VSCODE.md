# CTX SOFTWARE SYSTEM - VS Code Development Guide

This guide provides comprehensive instructions on how to set up and run the CTX SOFTWARE SYSTEM in VS Code for local development.

## System Requirements

- Node.js v16 or higher
- npm v7 or higher
- PostgreSQL v12 or higher (local installation required)
- VS Code with recommended extensions

## Getting Started

### 1. Installation Steps

#### Install VS Code Extensions

The following extensions will enhance your development experience:

- **ESLint**: JavaScript linting
- **Prettier**: Code formatting
- **TypeScript**: Language support
- **Tailwind CSS IntelliSense**: CSS class suggestions
- **SQLTools**: Database management (optional)
- **DotENV**: Environment file support
- **Live Share**: Collaborative editing (optional)

Install these by searching in the Extensions panel (Ctrl+Shift+X or Cmd+Shift+X on Mac).

#### Clone and Install Dependencies

```bash
# Clone the repository (if you haven't already)
git clone https://your-repository-url/ctx-software.git
cd ctx-software

# Install dependencies
npm install
```

### 2. Database Setup

The application requires a PostgreSQL database. Choose one of these setup methods:

#### Option A: Automated Setup (Recommended)

We've included a database initialization script that handles everything for you:

```bash
node scripts/init-local-db.js
```

This script will:
- Check if PostgreSQL is accessible
- Create the 'ctx_software' database (if it doesn't exist)
- Run necessary migrations to set up tables
- Display connection details for your .env file

#### Option B: Manual Setup

If you prefer manual control:

1. Create a PostgreSQL database:
   ```sql
   CREATE DATABASE ctx_software;
   ```

2. Run migrations with our Drizzle ORM tool:
   ```bash
   npm run db:push
   ```

#### Option C: Testing Connection Only

If you're unsure about your PostgreSQL setup:

1. Use the VS Code debugger to run "Test Database Connection"
2. Review the console output for connection status

### 3. Environment Configuration

Create a `.env` file in the project root with the following settings:

```ini
# Database connection
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ctx_software

# Environment
NODE_ENV=development 

# Security
SESSION_SECRET=your-long-random-secret-key-change-this

# Server options
PORT=5000
DEBUG=true
```

Adjust these values based on your local setup.

### 4. Launch the Application

#### Method 1: VS Code Debugger (Recommended)

1. Open the VS Code debugger (Ctrl+Shift+D or Cmd+Shift+D on Mac)
2. Select "Launch Server" from the dropdown
3. Click the green play button (or press F5)

This method provides full debugging capabilities with breakpoints.

#### Method 2: Terminal

```bash
npm run dev
```

The application will be available at http://localhost:5000

## Debugging Features

### Setting Breakpoints

1. Click in the gutter (left of line numbers) to set breakpoints
2. When execution reaches that line, it will pause
3. Inspect variables in the debug panel
4. Use the debug console to evaluate expressions

### Database Debugging

For database-related issues:

1. Use "Test Database Connection" from the debugger menu
2. Examine PostgreSQL logs (typically in /var/log/postgresql/)
3. Use SQLTools extension to directly query the database

## File Structure Overview

```
ctx-software/
├── client/             # Frontend React application
│   ├── src/
│   │   ├── components/ # UI components
│   │   ├── pages/      # Page components
│   │   ├── hooks/      # Custom React hooks
│   │   └── lib/        # Utility functions
├── server/             # Backend Express application
│   ├── routes.ts       # API route definitions
│   ├── storage.ts      # Data access layer
│   ├── db.ts           # Database connection
│   └── auth.ts         # Authentication logic
├── shared/             # Shared between client/server
│   └── schema.ts       # Database schema definitions
├── scripts/            # Utility scripts
└── .vscode/            # VS Code configuration
    ├── launch.json     # Debug configurations
    └── settings.json   # Editor settings
```

## Development Workflow

### Making Changes

1. **Backend Changes**:
   - Update schema in `shared/schema.ts`
   - Implement storage operations in `server/storage.ts`
   - Add API routes in `server/routes.ts`
   - The server restarts automatically when files change

2. **Frontend Changes**:
   - Create components in `client/src/components/`
   - Add or update pages in `client/src/pages/`
   - Route configuration is in `client/src/App.tsx`
   - The client hot-reloads automatically

### Testing Changes

- Use the VS Code debugger to step through code
- Check the terminal for server logs
- Review browser console for client-side logs

## Troubleshooting Guide

### Database Connection Issues

If you encounter "Failed to connect to database" errors:

1. Verify PostgreSQL is running:
   ```bash
   # For Ubuntu/Debian
   sudo systemctl status postgresql
   # For macOS
   brew services list
   # For Windows
   net start postgresql
   ```

2. Check credentials and permissions:
   - Make sure the PostgreSQL user exists with proper permissions
   - Verify the password in your .env file matches

3. Test direct connection:
   ```bash
   psql -U postgres -h localhost -p 5432 -d ctx_software
   ```

### Startup Errors

If the application fails to start:

1. Check for port conflicts:
   ```bash
   # Find processes using port 5000
   lsof -i :5000
   ```

2. Verify node_modules is complete:
   ```bash
   rm -rf node_modules
   npm install
   ```

3. Check environment configuration:
   - Ensure .env file exists and has correct format
   - Verify NODE_ENV is set to "development"

### Drizzle ORM Issues

For database schema problems:

1. Run schema regeneration:
   ```bash
   npm run db:push
   ```

2. Check migration logs in drizzle output
3. Use SQLTools to verify table structures

## Performance Optimization

For local development performance:

1. Keep database connections optimized
   - Check connection pooling in server/db.ts
   - Close connections that aren't needed

2. Minimize watch targets
   - Exclude node_modules in your file watcher config

## Resources and Support

- **Documentation**: See project documentation for detailed component information
- **API Reference**: Generated from code comments
- **Issue Tracking**: Submit bugs through the project issue tracker
- **Team Contact**: Reach out to the development team for assistance

## Contributing

Before submitting changes:

1. Run linting and type checking:
   ```bash
   npm run lint
   npm run check-types
   ```

2. Follow the coding standards in .eslintrc and .prettierrc
3. Add tests for new functionality
4. Document API changes