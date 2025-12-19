import { Code2 } from 'lucide-react';
import { CodeSandbox } from '../components/CodeSandbox';

interface HomeProps {
  user?: { name: string; college: string };
}

export function Home({ user }: HomeProps) {
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <header className="text-center mb-12">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Code2 className="w-12 h-12 text-blue-600" />
          <h1 className="text-4xl font-bold text-gray-900">Code Sandbox</h1>
        </div>
        <p className="text-gray-600">Create and preview HTML & CSS code in real-time</p>
      </header>

      <CodeSandbox userName={user?.name} userCollege={user?.college} />
    </div>
  );
}
