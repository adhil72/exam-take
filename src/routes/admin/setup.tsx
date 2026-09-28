import { createFileRoute } from '@tanstack/react-router'
import AdminSetupPage from '@/components/pages/admin/setup'

export const Route = createFileRoute('/admin/setup')({
  component: AdminSetupPage,
})
