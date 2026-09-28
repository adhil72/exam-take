import { createFileRoute } from '@tanstack/react-router'
import AdminExamsPage from '@/components/pages/admin/exams'

export const Route = createFileRoute('/admin/exams')({
  component: AdminExamsPage,
})
