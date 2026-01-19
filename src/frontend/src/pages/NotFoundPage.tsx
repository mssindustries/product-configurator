import { Link } from 'react-router-dom';
import { Button, Card } from '../components/ui';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-neutral-100 flex items-center justify-center">
      <Card padding="lg" className="text-center">
        <h1 className="text-6xl font-bold text-neutral-800 mb-4">404</h1>
        <p className="text-xl text-neutral-600 mb-6">Page not found</p>
        <Link to="/">
          <Button intent="primary">Go Home</Button>
        </Link>
      </Card>
    </div>
  );
}
