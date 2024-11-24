'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Users, BookOpen, Award, Settings, LogOut } from 'lucide-react';
import { usePathname } from 'next/navigation';
import Header from './Header';

interface ParentDashboardLayoutProps {
  children: React.ReactNode;
}

export default function ParentDashboardLayout({ children }: ParentDashboardLayoutProps) {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const menuItems = [
    {
      name: 'Child Profiles',
      icon: <Users className="w-5 h-5" />,
      href: '/parent/dashboard',
    },
    {
      name: 'Spelling Lists',
      icon: <BookOpen className="w-5 h-5" />,
      href: '/parent/spelling-lists',
    },
    {
      name: 'Progress Reports',
      icon: <Award className="w-5 h-5" />,
      href: '/parent/progress',
    },
    {
      name: 'Settings',
      icon: <Settings className="w-5 h-5" />,
      href: '/parent/settings',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-100 to-blue-100">
      <Header />
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-lg min-h-screen">
          <div className="p-4">
            <h2 className="text-xl font-bold text-purple-800 mb-6">Parent Dashboard</h2>
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
              onClick={signOut}
              className="flex items-center space-x-3 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
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