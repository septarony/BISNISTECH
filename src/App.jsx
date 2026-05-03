import QueueSystem from './components/QueueSystem'
import AdminCMS from './components/AdminCMS'

// Render AdminCMS jika path mengandung /admin
const isAdmin = window.location.pathname.startsWith('/admin')

export default function App() {
  if (isAdmin) return <AdminCMS />
  return (
    <div className="w-full">
      <QueueSystem />
    </div>
  )
}
