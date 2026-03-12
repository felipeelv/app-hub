# ServicesHub — B2B Service Intermediation Platform

## Overview

Full-stack B2B service platform with three portals: **Requester** (contratante), **Provider** (prestador), and **Admin** (intermediador). Built as a pnpm monorepo with React/Vite frontend and Express/PostgreSQL backend. All UI in Brazilian Portuguese (pt-BR).

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec → React Query hooks + Zod schemas)
- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui
- **State management**: TanStack Query (React Query)
- **Routing**: Wouter

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server (port 8080, proxied via /api)
│   └── services-hub/       # React/Vite frontend (port via BASE_PATH "/")
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/
│   └── src/seed.ts         # Seed script (5 profiles, 2+2 companies, 7 work orders)
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## Mock Auth (No Real Login)

- No real authentication — uses a **mock profile switcher** in the sidebar footer
- Active profile stored in `localStorage.activeProfileId`
- All API requests intercepted via `window.fetch` override in `src/lib/auth.tsx` to inject `x-profile-id` header
- **Profiles**: `admin-1` (Admin), `req-abc` (Empresa ABC), `req-xyz` (Empresa XYZ), `prov-techfix` (TechFix), `prov-repairpro` (RepairPro)

## Work Order State Machine

```
requested → accepted → in_progress → completed → invoiced → paid → paid_out → closed
                                                                              ↕
                                                                          cancelled
```

## Financial Flow

- **Requester pays**: base price + travel cost + commission → `finalPrice`
- **Provider receives**: base price + travel cost → `providerReceivable`
- **Platform earns**: commission (default 15% of base price) → `commissionAmount`
- All stored in `invoices`, `payments`, `payouts` tables

## Travel Pricing

- Calculated by CEP prefix matching `travel_pricing_rules` table
- Admin can configure rules per CEP prefix, region name, or fixed price
- Applied when work order is created/updated

## Portals

### Admin (`/admin/*`)
- Dashboard (KPIs, recent orders)
- Work Orders (list + detail + assign + cancel/reopen)
- Companies (requester + provider list)
- Faturas (commission breakdown per invoice)
- Pagamentos (received payments)
- Repasses (provider payouts — register new)
- Deslocamento / Comissão (travel pricing rules + commission rate)
- Auditoria (audit log of all state changes)
- Notificações

### Requester (`/requester/*`)
- Dashboard (open/in-progress/completed counts + pending amount)
- Catálogo de Serviços (browse + request new service)
- Minhas Solicitações (work orders list + detail)
- Faturas e Pagamentos (pending invoices + multi-select pay modal)
- Notificações

### Provider (`/provider/*`)
- Dashboard (new/in-progress counts + receivables)
- Meu Catálogo (manage service offerings)
- Ordens Atribuídas (list + accept/start/complete actions)
- Financeiro (pending receivables + payout history)
- Notificações

## Mapbox Map

- Work order detail pages (Admin, Provider, Requester) show an interactive Mapbox map with a pin at the service address
- Uses `mapbox-gl` library with Mapbox Geocoding API to convert addresses to coordinates
- Requires `VITE_MAPBOX_TOKEN` environment variable (Mapbox public access token)
- Component: `artifacts/services-hub/src/components/MapView.tsx`
- Graceful fallback shown if geocoding fails or token is missing

## Key Files

- `lib/api-spec/openapi.yaml` — OpenAPI source of truth
- `artifacts/services-hub/src/App.tsx` — Frontend routing
- `artifacts/services-hub/src/lib/auth.tsx` — Profile context + fetch interceptor
- `artifacts/services-hub/src/components/layout/AppLayout.tsx` — Sidebar + nav (role-based)
- `artifacts/services-hub/src/components/ui/StatusBadge.tsx` — Status badge (pt-BR labels)
- `artifacts/api-server/src/routes/index.ts` — Route mounting
- `lib/db/src/schema/index.ts` — DB schema barrel exports
- `scripts/src/seed.ts` — Seed data
- `artifacts/api-server/src/lib/travel.ts` — Travel/commission pricing logic

## Workflows

- `artifacts/api-server: API Server` — `pnpm --filter @workspace/api-server run dev` (port 8080)
- `artifacts/services-hub: web` — `pnpm --filter @workspace/services-hub run dev`

## Database

- Uses Replit-provided PostgreSQL via `DATABASE_URL`
- Schema pushed with: `pnpm --filter @workspace/db run push`
- Seeded with: `pnpm --filter @workspace/scripts run seed`

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` (composite: true). Run `pnpm run typecheck` from root.

- **Always typecheck from the root** — `tsc --build --emitDeclarationOnly`
- **`emitDeclarationOnly`** — we only emit `.d.ts`; JS bundled by esbuild/tsx/vite
- **Project references** — cross-package imports must list refs in tsconfig.json

## Root Scripts

- `pnpm run build` — typecheck then build all packages
- `pnpm run typecheck` — `tsc --build --emitDeclarationOnly`
- `pnpm --filter @workspace/api-spec run codegen` — regenerate hooks + schemas from OpenAPI
- `pnpm --filter @workspace/scripts run seed` — reseed database
