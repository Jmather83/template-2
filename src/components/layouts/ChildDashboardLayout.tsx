'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Trophy, Castle, Map, Book, Settings, LogOut, Search } from 'lucide-react';

interface ChildDashboardLayoutProps {
  children: React.ReactNode;
}

export default function ChildDashboardLayout({ children }: ChildDashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    localStorage.removeItem('childUser');
    router.push('/');
  };

  const menuItems = [
    {
      name: 'Spell Books',
      icon: <Book className="w-5 h-5" />,
      href: '/child/game',
    },
    {
      name: 'Word Search',
      icon: <Search className="w-5 h-5" />,
      href: '/child/word-search',
    },
    {
      name: 'Test History',
      icon: <Trophy className="w-5 h-5" />,
      href: '/child/test-history',
    },
    {
      name: 'Overworld Map',
      icon: <Map className="w-5 h-5" />,
      href: '/child/overworld',
    },
    {
      name: 'Your Castle',
      icon: <Castle className="w-5 h-5" />,
      href: '/child/castle',
    },
    {
      name: 'Options',
      icon: <Settings className="w-5 h-5" />,
      href: '/child/options',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 to-purple-100">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-lg min-h-screen">
          <div className="p-4">
            <h2 className="text-xl font-bold text-purple-800 mb-6">Adventure Menu</h2>
            <nav className="space-y-2">
              {menuItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors ${
                    pathname === item.href
                      ? 'bg-purple-100 text-purple-800'
                      : 'text-gray-600 hover:bg-purple-50'
                  }`}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </Link>
              ))}
            </nav>
          </div>
          <div className="absolute bottom-4 left-4">
            <button
              onClick={handleLogout}
              className="flex items-center space-x-3 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Exit Game</span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8 overflow-auto">
          {children}
        </div>
      </div>
    </div>
  );
} 