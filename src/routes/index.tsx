import { createFileRoute } from '@tanstack/react-router'
import StudentHomePage from '@/components/pages/student/home'

export const Route = createFileRoute('/')({
  component: StudentHomePage,
})
