import { createFileRoute } from '@tanstack/react-router'
import AdminLobbyPage from '@/components/pages/admin/lobby'

export const Route = createFileRoute('/admin/lobby')({
  component: AdminLobbyPage,
})
