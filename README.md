# CTX SOFTWARE SYSTEM

An internal business management system with machinery, inventory, purchases, sales, and operations tracking.

## Overview

CTX SOFTWARE SYSTEM is a comprehensive management tool designed to streamline internal business processes. It provides a unified platform for managing various aspects of business operations, from machinery and inventory to sales and document management.

## Features

- **User Authentication**: Secure login and role-based access control
- **Machinery Management**: Track machinery details, maintenance schedules, and service records
- **Inventory Control**: Manage stock levels, warehouse assignments, and inventory transfers
- **Purchase Management**: Record and track purchase orders, vendor information, and received items
- **Sales Tracking**: Monitor sales, customer information, and order fulfillment
- **Delivery Scheduling**: Plan and track deliveries and logistics
- **Document Management**: Upload, categorize, and retrieve important business documents
- **Project Operations**: Create and manage projects, tasks, and resource allocation
- **Reporting**: Generate comprehensive reports on various business metrics

## Technical Stack

- **Frontend**: React with Tailwind CSS and shadcn/ui components
- **Backend**: Express.js running on Node.js
- **Database**: PostgreSQL (via Neon Database)
- **API**: REST API with TanStack Query for data fetching
- **Authentication**: Session-based authentication with Passport.js
- **ORM**: Drizzle ORM for database interactions
- **Deployment**: Configured for Vercel deployment

## Getting Started

### Local Development

1. Clone the repository
2. Install dependencies: `npm install`
3. Create a PostgreSQL database (locally or using a cloud provider like Neon)
4. Set up environment variables (see `.env.example`)
5. Run database migrations: `npm run db:push`
6. Start the development server: `npm run dev`

### Production Deployment

For detailed deployment instructions, see [DEPLOY.md](./DEPLOY.md).

## Module Documentation

### Machinery Module
Manage all company machinery and equipment. Track service history, maintenance schedules, and operational status.

### Purchases Module
Handle purchase orders, vendor management, and procurement processes. Track orders from creation to delivery.

### Inventory Module
Manage stock levels across different warehouses. Track item movement, restocking needs, and inventory transfers.

### Sales Module
Process customer orders, track sales metrics, and manage customer relationships.

### Delivery Module
Schedule and track product deliveries, manage logistics, and optimize delivery routes.

### Documents Module
Store, categorize, and retrieve important business documents. Maintain a centralized document repository.

### Operations Module
Plan and execute projects, assign tasks, track progress, and allocate resources efficiently.

### Reports Module
Generate comprehensive business reports and analytics to support decision-making.

## License

Proprietary - All rights reserved.

---

© 2025 CTX SOFTWARE SYSTEM. All rights reserved.