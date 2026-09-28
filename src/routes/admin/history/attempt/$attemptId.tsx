import { createFileRoute } from '@tanstack/react-router'
import { AdminAttemptResultsPage } from '@/components/pages/admin/history/attempt-view'

export const Route = createFileRoute('/admin/history/attempt/$attemptId')({
  component: AdminAttemptResultsPage,
})
