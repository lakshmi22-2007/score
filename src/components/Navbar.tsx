import { Code2, User } from 'lucide-react';

interface NavbarProps {
  userName?: string;
}

export function Navbar({ userName }: NavbarProps) {
  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <Code2 className="w-8 h-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">Pixel Perfect</span>
          </div>
          
          {userName && (
            <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-lg">
              <User className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-gray-800">{userName}</span>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
