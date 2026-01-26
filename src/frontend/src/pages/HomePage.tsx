import { useAuth } from '@/hooks/useAuth';
import AdminPage from './AdminPage';
import ClientPage from './ClientPage';

/**
 * HomePage - Renders different content based on user role.
 * Shows AdminPage for admin users and ClientPage for client users.
 */
export default function HomePage() {
  const { role } = useAuth();

  if (role === 'admin') {
    return <AdminPage />;
  }

  return <ClientPage />;
}
