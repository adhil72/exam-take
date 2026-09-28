import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import AdminConfigurePage from '@/components/pages/admin/configure'

const configureSearchSchema = z.object({
  examId: z.string()
})

export const Route = createFileRoute('/admin/configure')({
  validateSearch: (search) => configureSearchSchema.parse(search),
  component: RouteComponent,
})

function RouteComponent() {
  const { examId } = Route.useSearch()
  return <AdminConfigurePage examId={examId} />
}
