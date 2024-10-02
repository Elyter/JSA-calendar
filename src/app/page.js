"use client";

import dynamic from 'next/dynamic';

const Calendar = dynamic(() => import('../components/Calendar'), { ssr: false });

export default function Home() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Réservations des terrains</h1>
      <Calendar />
    </div>
  );
}