import { useState } from 'react';
import { User, GraduationCap, Phone } from 'lucide-react';

interface SignInProps {
  onSignIn: (name: string, college: string, phone: string) => void;
}

export function SignIn({ onSignIn }: SignInProps) {
  const [name, setName] = useState('');
  const [college, setCollege] = useState('');
  const [phone, setPhone] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && college.trim() && phone.trim()) {
      onSignIn(name.trim(), college.trim(), phone.trim());
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ 
      backgroundColor: '#87CEEB',
      backgroundImage: `
        linear-gradient(to right, transparent 0%, transparent 8%, rgba(180,180,180,0.3) 8%, rgba(180,180,180,0.3) 9%, transparent 9%, transparent 10%, rgba(180,180,180,0.3) 10%, rgba(180,180,180,0.3) 14%, transparent 14%, transparent 100%),
        linear-gradient(to right, transparent 0%, transparent 7.5%, rgba(200,200,200,0.5) 7.5%, rgba(200,200,200,0.5) 8.5%, transparent 8.5%, transparent 9.5%, rgba(200,200,200,0.5) 9.5%, rgba(200,200,200,0.5) 14.5%, transparent 14.5%, transparent 100%),
        linear-gradient(to right, transparent 0%, transparent 7%, rgba(220,220,220,0.7) 7%, rgba(220,220,220,0.7) 15%, transparent 15%, transparent 100%),
        linear-gradient(to right, transparent 0%, transparent 6%, white 6%, white 16%, transparent 16%, transparent 100%),
        linear-gradient(to right, transparent 30%, transparent 35%, rgba(180,180,180,0.3) 35%, rgba(180,180,180,0.3) 36%, transparent 36%, transparent 38%, rgba(180,180,180,0.3) 38%, rgba(180,180,180,0.3) 42%, transparent 42%, transparent 100%),
        linear-gradient(to right, transparent 30%, transparent 34.5%, rgba(200,200,200,0.5) 34.5%, rgba(200,200,200,0.5) 36.5%, transparent 36.5%, transparent 37.5%, rgba(200,200,200,0.5) 37.5%, rgba(200,200,200,0.5) 42.5%, transparent 42.5%, transparent 100%),
        linear-gradient(to right, transparent 30%, transparent 34%, rgba(220,220,220,0.7) 34%, rgba(220,220,220,0.7) 43%, transparent 43%, transparent 100%),
        linear-gradient(to right, transparent 30%, transparent 33%, white 33%, white 44%, transparent 44%, transparent 100%),
        linear-gradient(to right, transparent 55%, transparent 60%, rgba(180,180,180,0.3) 60%, rgba(180,180,180,0.3) 61%, transparent 61%, transparent 63%, rgba(180,180,180,0.3) 63%, rgba(180,180,180,0.3) 68%, transparent 68%, transparent 100%),
        linear-gradient(to right, transparent 55%, transparent 59.5%, rgba(200,200,200,0.5) 59.5%, rgba(200,200,200,0.5) 61.5%, transparent 61.5%, transparent 62.5%, rgba(200,200,200,0.5) 62.5%, rgba(200,200,200,0.5) 68.5%, transparent 68.5%, transparent 100%),
        linear-gradient(to right, transparent 55%, transparent 59%, rgba(220,220,220,0.7) 59%, rgba(220,220,220,0.7) 69%, transparent 69%, transparent 100%),
        linear-gradient(to right, transparent 55%, transparent 58%, white 58%, white 70%, transparent 70%, transparent 100%),
        linear-gradient(to right, transparent 78%, transparent 83%, rgba(180,180,180,0.3) 83%, rgba(180,180,180,0.3) 87%, transparent 87%, transparent 100%),
        linear-gradient(to right, transparent 78%, transparent 82.5%, rgba(200,200,200,0.5) 82.5%, rgba(200,200,200,0.5) 87.5%, transparent 87.5%, transparent 100%),
        linear-gradient(to right, transparent 78%, transparent 82%, white 82%, white 88%, transparent 88%, transparent 100%),
        linear-gradient(to bottom, #87CEEB 0%, #87CEEB 50%, #7DC8F0 50%, #7DC8F0 60%, #6EB5D8 60%, #6EB5D8 70%, #7EC850 70%, #7EC850 80%, #75C048 80%, #75C048 90%, #68B040 90%, #68B040 100%)
      `,
      backgroundSize: '100% 2.5%, 100% 2.5%, 100% 2.5%, 100% 2.5%, 100% 3%, 100% 3%, 100% 3%, 100% 3%, 100% 2%, 100% 2%, 100% 2%, 100% 2%, 100% 1.5%, 100% 1.5%, 100% 1.5%, 100% 100%',
      backgroundPosition: '0 4.5%, 0 6%, 0 7%, 0 9%, 0 2.5%, 0 4%, 0 5%, 0 7%, 0 10.5%, 0 12%, 0 13%, 0 15%, 0 5.5%, 0 7%, 0 8%, 0 0',
      backgroundRepeat: 'no-repeat',
      imageRendering: 'pixelated'
    }}>
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

          <div>
            <label className="block text-xs font-minecraft text-white mb-2" style={{ textShadow: '2px 2px 0 rgba(0,0,0,0.7)' }}>
              <Phone className="inline w-4 h-4 mr-2" />
              Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone number"
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
