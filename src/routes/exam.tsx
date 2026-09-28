import { createFileRoute } from '@tanstack/react-router'
import StudentExamPage from '@/components/pages/student/exam'

export const Route = createFileRoute('/exam')({
  component: StudentExamPage,
})
