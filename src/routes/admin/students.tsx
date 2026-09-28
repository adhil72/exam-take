import { createFileRoute } from '@tanstack/react-router'
import AdminStudentsPage from '@/components/pages/admin/students'

export const Route = createFileRoute('/admin/students')({
  component: AdminStudentsPage,
})
