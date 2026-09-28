import { createFileRoute } from '@tanstack/react-router'
import { AdminHistoryPage } from '@/components/pages/admin/history/index'

export const Route = createFileRoute('/admin/history/')({
  component: AdminHistoryPage,
})
