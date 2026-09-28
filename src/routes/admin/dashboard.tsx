import { createFileRoute } from '@tanstack/react-router'
import AdminDashboardPage from '@/components/pages/admin/dashboard'

export const Route = createFileRoute('/admin/dashboard')({
  component: AdminDashboardPage,
})
