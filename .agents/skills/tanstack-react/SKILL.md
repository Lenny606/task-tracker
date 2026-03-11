---
name: TanStack React
description: Essential guidelines and conventions for building applications with TanStack Start, React Router, and React Query ecosystem.
---
# TanStack React Framework Guidelines

When building applications with TanStack Start, TanStack Router, and TanStack Query, follow these best practices for optimal performance, type safety, and maintainability.

## 1. File-Based Routing with TanStack Start/Router
- **Route Definitions:** Use the file-system based routing conventions (e.g., `src/routes/index.tsx`, `src/routes/about.tsx` or similar as per configuration).
- **Route Options:** Use `createFileRoute` rather than manually instantiating `createRoute`. This ensures strict type safety across the application.
- **Data Loading:** Use `Route.addLoader` or the `loader` export object for data loading before components render. Avoid `useEffect` for data fetching where a loader can handle it.
- **Server Functions:** When using TanStack Start (Nitro under the hood), place server-side logic in `createServerFn` actions. Make sure mutations update the UI via router invalidation.

## 2. Server Functions and Data Mutations
- Export server-side actions using `createServerFn()` for both GET and POST operations.
- For form submissions or data updates, prefer `useServerFn` combined with React Query mutations or Router's built-in actions mechanism.

## 3. Data Fetching and Caching (React Query integration)
- Use standard React Query hooks (`useQuery`, `useSuspenseQuery`, `useMutation`) for client-side interactions over server functions.
- For route loaders, use SSR-compatible queries like `queryOptions` and pass them into the loader with `queryClient.ensureQueryData(queryOptions())`.
- Define **query keys** consistently as arrays matching the URL route hierarchy.
- **Invalidation:** Automatically invalidate queries using `queryClient.invalidateQueries({ queryKey })` or invalidate all data using useRouter router invalidation (`router.invalidate()`) on mutation success.

## 4. Component Architecture
- Separate route files (`*.route.tsx`/`*.tsx` inside `routes`) from UI components. Keep complex UI nested in `src/components/`.
- Export a component directly as the default export of a route file or pass it directly in `createFileRoute("/path")({ component: MyComponent })`.
- Utilize standard HTML attributes and native web platform APIs as heavily encouraged by TanStack.

## 5. Type Safety
- **DO NOT** use `any`. Leverage the inferred types from `createFileRoute`, `loader`, and router context.
- Extend `Register` interface if your project manual mapping of router.
- Use native typescript schemas or `zod` inside the Server Functions to validate data payloads.
