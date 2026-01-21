import { Code2 } from 'lucide-react';
import { CodeSandbox } from '../components/CodeSandbox';

interface HomeProps {
  user?: { name: string; college: string };
}

export function Home({ user }: HomeProps) {
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <header className="text-center mb-12 minecraft-panel bg-minecraft-grass grass-texture p-8 animate-float">
        <div className="flex items-center justify-center gap-3 mb-4">
         
          <h1 className="text-2xl md:text-3xl font-minecraft font-bold text-white" style={{ textShadow: '4px 4px 0 rgba(0,0,0,0.7)' }}>Crafting Code</h1>
        </div>
        <p className="text-xs md:text-sm font-minecraft text-white" style={{ textShadow: '2px 2px 0 rgba(0,0,0,0.7)' }}>Create and experiment with code in real-time</p>
      </header>

      <CodeSandbox userName={user?.name} userCollege={user?.college} />
    </div>
  );
}
