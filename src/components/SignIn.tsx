import { useState } from 'react';
import { User, GraduationCap } from 'lucide-react';

interface SignInProps {
  onSignIn: (name: string, college: string) => void;
}

export function SignIn({ onSignIn }: SignInProps) {
  const [name, setName] = useState('');
  const [college, setCollege] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && college.trim()) {
      onSignIn(name.trim(), college.trim());
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#FAFAD2' }}>
      <div className="minecraft-panel bg-minecraft-wood wood-texture p-8 w-full max-w-md animate-float">
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-minecraft font-bold text-white mb-2" style={{ textShadow: '4px 4px 0 rgba(0,0,0,0.7)' }}>Pixel Perfect</h1>
          <p className="text-xs font-minecraft text-minecraft-gold" style={{ textShadow: '2px 2px 0 rgba(0,0,0,0.7)' }}>Enter to start crafting
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-minecraft text-white mb-2" style={{ textShadow: '2px 2px 0 rgba(0,0,0,0.7)' }}>
              <User className="inline w-4 h-4 mr-2" />
              Team Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Team name"
              className="w-full px-4 py-3 minecraft-panel bg-gradient-to-br from-amber-700 to-amber-900 text-white font-minecraft text-xs placeholder-amber-300 focus:outline-none focus:ring-4 focus:ring-yellow-400 transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-minecraft text-white mb-2" style={{ textShadow: '2px 2px 0 rgba(0,0,0,0.7)' }}>
              <GraduationCap className="inline w-4 h-4 mr-2" />
              College
            </label>
            <input
              type="text"
              value={college}
              onChange={(e) => setCollege(e.target.value)}
              placeholder="College name"
              className="w-full px-4 py-3 minecraft-panel bg-gradient-to-br from-amber-700 to-amber-900 text-white font-minecraft text-xs placeholder-amber-300 focus:outline-none focus:ring-4 focus:ring-yellow-400 transition-all"
              required
            />
          </div>

          <button
            type="submit"
            className="minecraft-btn w-full bg-minecraft-grass grass-texture hover:brightness-110 text-white font-minecraft text-xs py-3 px-6 transition-all duration-200 shadow-lg hover:shadow-xl animate-glow"
          >
            <span style={{ textShadow: '2px 2px 0 rgba(0,0,0,0.7)' }}>Get In</span>
          </button>
        </form>
      </div>
    </div>
  );
}
