import { CodeSandbox } from '../components/CodeSandbox';
import lakLogo from '../assets/lak.png';
import obsidianTexture from '../assets/asf.jpg';

interface HomeProps {
  user?: { name: string; college: string };
  question?: {
    id: string;
    roundno: number;
    htmlcode: string;
    csscode: string;
  };
}

export function Home({ user, question }: HomeProps) {
  return (
    <div className="px-4 py-8 max-w-7xl mx-auto">
      <br></br>
      <header className="text-center mb-12 minecraft-panel p-8 animate-float" style={{ backgroundImage: `url(${obsidianTexture})`, backgroundRepeat: 'repeat', backgroundSize: 'auto', imageRendering: 'pixelated', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: `url(${obsidianTexture})`, backgroundRepeat: 'repeat', backgroundSize: 'auto', filter: 'blur(3px)', zIndex: 0 }}></div>
        <div className="flex items-center justify-center gap-3 mb-4" style={{ position: 'relative', zIndex: 1 }}>
         
          <img src={lakLogo} alt="Pixel Perfect" className="h-24 md:h-32" style={{ imageRendering: 'pixelated' }} />
        </div>
        <p className="text-xs md:text-sm font-minecraft text-white" style={{ textShadow: '2px 2px 0 rgba(0,0,0,0.7)', position: 'relative', zIndex: 1 }}>Create and experiment with code in real-time</p>
      </header>

      <CodeSandbox userName={user?.name} userCollege={user?.college} question={question} />
    </div>
  );
}


