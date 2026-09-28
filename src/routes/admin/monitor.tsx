import { createFileRoute } from '@tanstack/react-router'
import AdminMonitorPage from '@/components/pages/admin/monitor'

export const Route = createFileRoute('/admin/monitor')({
  component: AdminMonitorPage,
})
