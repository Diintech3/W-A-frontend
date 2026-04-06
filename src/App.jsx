import { Navigate, createBrowserRouter, RouterProvider } from 'react-router-dom'
import { AuthProvider, useAuthContext } from './context/AuthContext'
import { DashboardLayout } from './components/layout/DashboardLayout'
import { Loader } from './components/ui/Loader'

import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import Dashboard from './pages/dashboard/Dashboard'
import Contacts from './pages/contacts/Contacts'
import ContactGroups from './pages/contacts/ContactGroups'
import Campaigns from './pages/campaigns/Campaigns'
import CreateCampaign from './pages/campaigns/CreateCampaign'
import Templates from './pages/templates/Templates'
import BotFlow from './pages/chatbot/BotFlow'
import Inbox from './pages/inbox/Inbox'
import Analytics from './pages/analytics/Analytics'
import Settings from './pages/settings/Settings'

function ProtectedLayout() {
  const { loading, isAuthenticated } = useAuthContext()
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <Loader label="Loading session…" />
      </div>
    )
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <DashboardLayout />
}

function AuthLayout({ children }) {
  const { loading, isAuthenticated } = useAuthContext()
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <Loader />
      </div>
    )
  }
  if (isAuthenticated) return <Navigate to="/" replace />
  return children
}

const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <AuthLayout>
        <Login />
      </AuthLayout>
    ),
  },
  {
    path: '/register',
    element: (
      <AuthLayout>
        <Register />
      </AuthLayout>
    ),
  },
  {
    path: '/',
    element: <ProtectedLayout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'campaigns', element: <Campaigns /> },
      { path: 'campaigns/new', element: <CreateCampaign /> },
      { path: 'contacts', element: <Contacts /> },
      { path: 'contacts/groups', element: <ContactGroups /> },
      { path: 'inbox', element: <Inbox /> },
      { path: 'chatbot', element: <BotFlow /> },
      { path: 'templates', element: <Templates /> },
      { path: 'analytics', element: <Analytics /> },
      { path: 'settings', element: <Settings /> },
    ],
  },
])

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider
        router={router}
        future={{ v7_startTransition: true }}
      />
    </AuthProvider>
  )
}
