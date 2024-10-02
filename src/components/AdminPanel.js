import dynamic from 'next/dynamic';

const Calendar = dynamic(() => import('./Calendar'), { ssr: false });

export default function AdminPanel() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Panneau d'administration</h1>
      <Calendar isAdmin={true} />
    </div>
  );
}
