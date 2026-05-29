# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Project Overview

This is a wellness center/therapy management system with separate client and server applications. The system manages customer onboarding, consent forms, evaluations, therapist workflows, and a point-of-sale system.

**Key entities:** Customers, Therapists, Consent Forms, Evaluations, Packages, Products, POS Transactions, Receipts

## Monorepo Structure

This is a monorepo with two main applications:

- `client/` - React + Vite frontend application
- `server/` - Node.js + Express backend API
- `pwg_new.sql` - MySQL database schema dump

## Development Commands

### Client (Frontend)
```bash
cd client
npm install           # Install dependencies
npm run dev          # Start development server (Vite)
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Server (Backend)
```bash
cd server
npm install           # Install dependencies
npm run dev          # Start with nodemon (auto-restart)
npm start            # Start production server
```

### Database Setup
1. Create a MySQL database
2. Import the schema: `mysql -u root -p [database_name] < pwg_new.sql`
3. Configure environment variables (see below)

## Environment Configuration

### Client `.env`
```
VITE_API_URL="http://localhost:3052"
```

### Server `.env`
```
PORT=3052
NODE_ENV=development
DB_HOST="localhost"
DB_USER="root"
DB_PASSWORD=""
DB_NAME="db_name"
JWT_SECRET="your_jwt_secret"
FRONTEND_URL="http://localhost:5173"
```

## Architecture

### Client Architecture

**Tech Stack:** React 18, React Router v7, Vite, TailwindCSS, shadcn/ui, Axios

**Key Directories:**
- `src/pages/` - Page components (LoginPage, DashboardPage, TherapistDashboard, Pos, etc.)
- `src/components/` - Reusable components including complex forms
- `src/components/ui/` - shadcn/ui components (Button, Card, Dialog, etc.)
- `src/router/` - Route configuration with role-based access
- `src/context/` - React Context providers (AuthContext)
- `src/services/` - API service layer (authService, customerService, posService, etc.)
- `src/utils/` - Utilities including axios instance with auth interceptor
- `src/hooks/` - Custom React hooks

**Routing System:**
The app uses React Router with nested routes defined in `src/router/routes.jsx`:
- Public routes: `/login`, `/signup`, `/logout`
- Private routes (authenticated): `/`, `/dashboard`, `/profile`
- Customer multi-step form routes: `/steps/personal-data`, `/steps/consent`, `/steps/evaluation`, `/steps/review`, `/steps/feedback`
- Therapist routes: `/therapist/*` (dashboard, POS, checkout, evaluations, transactions)

Routes are protected using `<ProtectedRoute>` and `<PublicRoute>` wrapper components with role-based access control (Customer vs Therapist).

**Authentication Flow:**
- JWT tokens stored in cookies (js-cookie library)
- AuthContext manages auth state globally
- Axios interceptor in `src/utils/api.js` automatically adds Bearer token to requests
- Role-based redirects after login (Therapist → `/therapist`, Customer → `/`)

**Form System:**
The application has extensive multi-step forms:
- Customer Registration Form (personal data, emergency contact, interests, referrer)
- Customer Consent Form (health declaration, device selection, signatures, disclaimers)
- Evaluation Forms (body part selection with canvas, pain areas, therapist notes)
- Feedback and Review Forms

### Server Architecture

**Tech Stack:** Express.js, MySQL2 (with connection pooling), JWT, bcryptjs, Zod validation, Helmet, Morgan

**Pattern:** MVC-style with service layer separation

**Key Directories:**
- `src/routes/` - Route definitions, mounted at `/api/*`
- `src/controllers/` - Request handlers (business logic)
- `src/models/` - Database queries and data access
- `src/middlewares/` - Auth middleware (`authenticateToken`) and Zod schema validation
- `src/schemas/` - Zod validation schemas
- `src/services/` - Business logic services
- `src/utils/` - Token utilities and helpers
- `src/config/` - Database connection pool configuration

**API Structure:**
All routes are prefixed with `/api` and organized by resource:
- `/api/auth` - Login, signup
- `/api/profile` - User profile
- `/api/customer` - Customer CRUD operations
- `/api/interests` - Customer interests
- `/api/consent` - Consent form management
- `/api/therapist` - Therapist operations
- `/api/evaluation` - Evaluation forms
- `/api/products` - Product catalog
- `/api/pos` - Point of sale transactions
- `/api/package` - Package management
- `/api/receipt` - Receipt generation

**Database Connection:**
- Uses `mysql2/promise` with connection pooling (limit: 10 connections)
- Pool configured in `src/config/db.js`
- Server startup includes retry logic for database connection (5 retries with 5s delay)

**Authentication:**
- JWT-based authentication with Bearer tokens
- `authenticateToken` middleware extracts and verifies tokens from `Authorization` header
- Token utilities in `src/utils/tokenUtils.js`
- Tokens include: userId, userName, email, role, customerId/therapistId

### Database Schema

**Main Tables:**
- `customers` - Customer records
- `users` - User accounts (linked to customers/therapists)
- `consentfrm` - Consent forms
- `consent_health_conditions` - Health condition details
- `evaluations` - Evaluation records
- `evaluation_pain_areas` - Pain area annotations
- `evalannotate` - Evaluation annotations
- `feedbacks` - Customer feedback
- `products` - Product catalog
- `package` - Service packages
- `packagedetails` - Package line items
- `custpackages` - Customer package purchases
- `poshd` - POS transaction headers
- `poslines` - POS transaction line items
- `customer_interests` - Customer interest selections
- `session_notes` - Therapist session notes

## UI Component System

The client uses **shadcn/ui** (New York style) configured with:
- TailwindCSS with CSS variables for theming
- Base color: neutral
- Icon library: lucide-react
- Path aliases: `@/components`, `@/lib/utils`, `@/hooks`

Configuration in `client/components.json`.

To add new shadcn components, run from `client/` directory:
```bash
npx shadcn@latest add [component-name]
```

## Key Implementation Patterns

### Service Layer Pattern
Both client and server use a service layer:
- **Client:** Service files in `src/services/` handle API calls (e.g., `authService.js`, `posService.js`)
- **Server:** Service files contain business logic, controllers call services, services call models

### Error Handling
- Server has global error handler middleware
- Client uses react-hot-toast for user-facing notifications
- Authentication errors return specific codes (e.g., `TOKEN_EXPIRED`)

### File Uploads
- Server uses multer for file uploads
- Uploads directory: `server/uploads/`

### Role-Based Access
Two primary roles: **Customer** and **Therapist**
- Different route sets and UI flows for each role
- ProtectedRoute component accepts `allowedRoles` prop
- JWT token includes role claim

## Common Workflows

### Adding a New API Endpoint
1. Define route in `server/src/routes/[resource]Routes.js`
2. Create controller method in `server/src/controllers/[resource]Controller.js`
3. Add model method in `server/src/models/[resource]Model.js` for database access
4. (Optional) Create Zod schema in `server/src/schemas/` and use `validateSchema` middleware
5. Register route in `server/src/routes/index.js`
6. Create corresponding service method in `client/src/services/[resource]Service.js`

### Adding a New Page
1. Create page component in `client/src/pages/`
2. Add route in `client/src/router/routes.jsx` (public, private, steps, or therapist)
3. Wrap with appropriate route protection (ProtectedRoute/PublicRoute)

### Working with Forms
Forms use controlled components with React state. Multi-step forms use a layout component (`StepsLayout`) with navigation between steps.

## Important Notes

- **Port defaults:** Client runs on 5173 (Vite), server on 3052 (or PORT env var)
- **CORS:** Server configured to allow credentials from frontend URL
- **Security:** Helmet middleware enabled, JWT tokens in HTTP-only cookies on client
- **Logging:** Morgan middleware logs HTTP requests in common format
- **Path aliases:** Client uses `@/` alias for src directory (configured in vite.config.js and jsconfig.json)
