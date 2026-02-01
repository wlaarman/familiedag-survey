import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { isAuthenticated } from '@/lib/auth';
import AdminDashboard from '@/components/admin/AdminDashboard';

function LoadingSpinner() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
    </main>
  );
}

export default async function AdminPage() {
  const authenticated = await isAuthenticated();

  if (!authenticated) {
    redirect('/admin/login');
  }

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <AdminDashboard />
    </Suspense>
  );
}
