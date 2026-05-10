// Board, streak, analytics, and agent pages all share the same
// sidebar layout. Each page folder just re-exports the dashboard layout.
// Create layout.tsx in each:  src/app/board/layout.tsx, etc.

export { default } from '@/app/dashboard/layout'
