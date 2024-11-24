'use client';

import Link from 'next/link';

export default function Header() {
  return (
    <div className="w-full bg-white shadow-md py-4 px-8">
      <div className="container mx-auto flex justify-center items-center">
        <Link href="/" className="text-3xl font-bold text-purple-800 hover:text-purple-700 transition">
          SpellQuest Adventure
        </Link>
      </div>
    </div>
  );
} 