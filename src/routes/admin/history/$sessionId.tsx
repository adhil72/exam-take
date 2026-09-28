import { createFileRoute } from '@tanstack/react-router'
import { AdminSessionResultsPage } from '@/components/pages/admin/history/session-view'

export const Route = createFileRoute('/admin/history/$sessionId')({
  component: AdminSessionResultsPage,
})
