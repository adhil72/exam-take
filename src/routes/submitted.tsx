import { createFileRoute } from '@tanstack/react-router'
import StudentSubmittedPage from '@/components/pages/student/submitted'

export const Route = createFileRoute('/submitted')({
  component: StudentSubmittedPage,
})
