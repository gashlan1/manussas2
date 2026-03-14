# AGLC CRM: Deployment and Configuration Guide

**Document Type:** Technology Transfer  
**Version:** 2.0  
**Date:** March 15, 2026  
**Classification:** Confidential

---

## 1. Prerequisites

Before deploying the AGLC CRM system, ensure the following requirements are met:

| Requirement | Minimum Version | Purpose |
|-------------|----------------|---------|
| Node.js | 22.x LTS | Runtime environment |
| pnpm | 10.4+ | Package manager |
| MySQL | 8.0+ (or TiDB) | Database server |
| AWS S3 (or compatible) | - | File/document storage |
| OpenAI-compatible API | GPT-4 class | AI agent functionality |

---

## 2. Environment Variables

The following environment variables must be configured for the system to function. They are organized by category with their purpose and format.

### 2.1 Database

| Variable | Required | Format | Description |
|----------|----------|--------|-------------|
| `DATABASE_URL` | Yes | `mysql://user:pass@host:port/dbname?ssl={"rejectUnauthorized":true}` | MySQL connection string with SSL |

### 2.2 Authentication

| Variable | Required | Format | Description |
|----------|----------|--------|-------------|
| `JWT_SECRET` | Yes | Random 256-bit string | Session cookie signing key |
| `VITE_APP_ID` | Yes | UUID | Manus OAuth application ID |
| `OAUTH_SERVER_URL` | Yes | URL | Manus OAuth backend base URL |
| `VITE_OAUTH_PORTAL_URL` | Yes | URL | Manus login portal URL (frontend) |
| `OWNER_OPEN_ID` | Yes | String | Owner's Manus OAuth identifier |
| `OWNER_NAME` | Yes | String | Owner's display name |

### 2.3 AI/LLM Integration

| Variable | Required | Format | Description |
|----------|----------|--------|-------------|
| `BUILT_IN_FORGE_API_URL` | Yes | URL | LLM API endpoint |
| `BUILT_IN_FORGE_API_KEY` | Yes | Bearer token | Server-side LLM authentication |
| `VITE_FRONTEND_FORGE_API_KEY` | Yes | Bearer token | Client-side LLM authentication |
| `VITE_FRONTEND_FORGE_API_URL` | Yes | URL | Client-side LLM endpoint |

### 2.4 Analytics (Optional)

| Variable | Required | Format | Description |
|----------|----------|--------|-------------|
| `VITE_ANALYTICS_ENDPOINT` | No | URL | Analytics collection endpoint |
| `VITE_ANALYTICS_WEBSITE_ID` | No | String | Website tracking identifier |

---

## 3. Installation Steps

### 3.1 Clone the Repository

```bash
git clone https://github.com/gashlan1/manussas2.git
cd manussas2/AGLC_CRM/06_Source_Code
```

### 3.2 Install Dependencies

```bash
pnpm install
```

### 3.3 Configure Environment

Create a `.env` file in the project root with all required variables from Section 2. Example:

```env
DATABASE_URL=mysql://root:password@localhost:3306/aglc_crm?ssl={"rejectUnauthorized":true}
JWT_SECRET=your-256-bit-secret-key-here
BUILT_IN_FORGE_API_URL=https://api.openai.com/v1
BUILT_IN_FORGE_API_KEY=sk-your-api-key
```

### 3.4 Push Database Schema

```bash
pnpm db:push
```

This command uses Drizzle Kit to generate and apply migrations from the schema definition in `drizzle/schema.ts`. It will create all 25+ tables with their indexes and constraints.

### 3.5 Start Development Server

```bash
pnpm dev
```

The server starts on port 3000 by default (configurable via `PORT` environment variable). The Vite dev server handles frontend hot module replacement, and the Express server handles API requests.

### 3.6 Build for Production

```bash
pnpm build
```

This creates an optimized production build in the `dist/` directory. The frontend is compiled and bundled by Vite, and the server code is compiled by esbuild.

### 3.7 Start Production Server

```bash
pnpm start
```

---

## 4. Database Setup

### 4.1 Creating the Database

```sql
CREATE DATABASE aglc_crm CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

The `utf8mb4` character set is required for proper Arabic text storage and emoji support.

### 4.2 Schema Migration

The schema is managed entirely through Drizzle ORM. To apply changes:

```bash
# Generate migration files
npx drizzle-kit generate

# Apply migrations
npx drizzle-kit migrate

# Or use the combined command
pnpm db:push
```

### 4.3 Seeding Initial Data

To create the first admin user, register through the OAuth flow and then promote the user via SQL:

```sql
UPDATE users SET role = 'admin' WHERE email = 'admin@aglc.com.sa';
```

To create the initial company:

```sql
INSERT INTO companies (code, name_en, name_ar, company_type, enabled_modules, is_active)
VALUES ('AGLC', 'Alahmari & Gashlan Law Co.', 'شركة الأحمري وغشلان للمحاماة', 'law_firm',
  '["pipeline","proposals","billing","cases","tasks","clients","team","notifications","ai_agents","audit"]',
  true);
```

---

## 5. Project Scripts

| Script | Command | Description |
|--------|---------|-------------|
| Development | `pnpm dev` | Start dev server with HMR |
| Build | `pnpm build` | Production build |
| Start | `pnpm start` | Start production server |
| Test | `pnpm test` | Run Vitest test suite |
| DB Push | `pnpm db:push` | Apply schema changes |
| DB Generate | `npx drizzle-kit generate` | Generate migration files |
| Type Check | `npx tsc --noEmit` | TypeScript compilation check |

---

## 6. Adapting for Kimi or Other Platforms

### 6.1 LLM Provider Replacement

The LLM integration is abstracted through the `invokeLLM` helper in `server/_core/llm.ts`. To replace the LLM provider:

1. Open `server/_core/llm.ts` (332 lines).
2. The function accepts an OpenAI-compatible message format with `messages`, `tools`, `response_format`, and other standard parameters.
3. Replace the API endpoint URL and authentication with your provider's credentials.
4. The function returns an OpenAI-compatible response format with `choices[0].message.content`.

If using Kimi's API, the message format is compatible. Simply update the base URL and API key:

```typescript
// In server/_core/llm.ts or env configuration
const LLM_BASE_URL = "https://api.moonshot.cn/v1";  // Kimi API
const LLM_API_KEY = "your-kimi-api-key";
```

### 6.2 Authentication Replacement

To replace Manus OAuth with another provider:

1. Modify `server/_core/oauth.ts` to handle your OAuth provider's callback.
2. Update `client/src/const.ts` to generate the correct login URL.
3. The session management (JWT cookies) remains the same regardless of OAuth provider.

### 6.3 Database Migration

To migrate from TiDB to standard MySQL or PostgreSQL:

For **MySQL 8.0+**, the schema works as-is since it uses `mysqlTable` from Drizzle ORM.

For **PostgreSQL**, you would need to:
1. Replace all `mysqlTable` with `pgTable` in `drizzle/schema.ts`.
2. Replace `mysqlEnum` with `pgEnum`.
3. Replace `int().autoincrement()` with `serial()`.
4. Update `drizzle.config.ts` to use the PostgreSQL dialect.
5. Update the `DATABASE_URL` format.

### 6.4 File Storage

The S3 storage helpers in `server/storage.ts` use standard AWS S3 SDK calls. To use a different provider:

1. Replace the S3 client configuration with your provider's credentials.
2. The `storagePut` and `storageGet` functions maintain the same interface.
3. Compatible alternatives include MinIO, Cloudflare R2, or Google Cloud Storage.

---

## 7. Testing

### 7.1 Running Tests

```bash
pnpm test
```

The test suite includes 26 tests covering all major backend routers. Tests use Vitest with the test pattern from `server/*.test.ts`.

### 7.2 Test Coverage

| Router | Tests | Coverage |
|--------|-------|----------|
| Auth (logout) | 1 | Session management |
| Pipeline | 5 | CRUD, stage updates, activities |
| Fee Proposals | 4 | CRUD, status updates |
| Billing (Timesheets) | 3 | Create, list, status |
| Billing (Invoices) | 3 | Create, list, payments |
| Cases | 3 | CRUD, status updates |
| Tasks | 3 | CRUD, status updates |
| Clients | 2 | Create, list |
| Dashboard | 1 | Stats aggregation |
| Notifications | 1 | List, mark read |

### 7.3 Adding Tests

Follow the pattern in `server/crm.test.ts`:

```typescript
import { describe, it, expect } from "vitest";

describe("Feature Router", () => {
  it("should perform expected action", async () => {
    // Test implementation
    expect(result).toBeDefined();
  });
});
```

---

## 8. Design System Themes

The system includes 5 switchable themes defined in `client/src/index.css`:

| Theme | Class | Description |
|-------|-------|-------------|
| LawSurface Blue | `.lawsurface` | Clean corporate blue/white (default) |
| Classic Dark | `.dark` | Black background with gold accents |
| Classic Light | `.light` | White background with navy accents |
| Neon Dark | `.neon-dark` | Dark with vibrant cyan/magenta |
| Neon Light | `.neon-light` | Light with vibrant accents |

Themes are managed through the `CrmThemeContext` in `client/src/contexts/CrmThemeContext.tsx`. The context applies the theme class to the document root element and persists the selection in localStorage.

---

## 9. Internationalization (i18n)

The system supports Arabic (RTL) and English (LTR) through the `LanguageContext` in `client/src/contexts/LanguageContext.tsx`. When the language changes:

1. The `dir` attribute on the HTML element switches between `rtl` and `ltr`.
2. The `lang` attribute updates to `ar` or `en`.
3. The sidebar position flips (right side for Arabic, left side for English).
4. Font families switch between Arabic-optimized (Noto Kufi Arabic, Tajawal) and English-optimized (Inter) typefaces.

All navigation labels, page titles, and UI strings are defined inline with conditional rendering based on the current language. The AI agents respond in the user's selected language.

---

## 10. Security Considerations

| Area | Implementation |
|------|---------------|
| Authentication | JWT session cookies with HttpOnly, Secure, SameSite flags |
| Authorization | Role-based access (admin/user) with protected procedures |
| Input Validation | Zod schemas on all tRPC inputs |
| SQL Injection | Prevented by Drizzle ORM parameterized queries |
| XSS | React's built-in escaping + no dangerouslySetInnerHTML |
| CSRF | SameSite cookie policy |
| File Upload | Server-side validation before S3 upload |
| API Keys | Server-side only, never exposed to client |
