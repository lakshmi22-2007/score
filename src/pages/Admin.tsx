import { useEffect, useState } from 'react';
import { Trophy, Plus, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ScoreInput } from '../components/ScoreInput';
import { ScoreDisplay } from '../components/ScoreDisplay';
import type { Score } from '../types/score';

interface AdminProps {
  user: { name: string; college: string };
}

export function Admin({ user }: AdminProps) {
  const [scores, setScores] = useState<Score[]>([]);
  const [loading, setLoading] = useState(true);
  const [showScoreInput, setShowScoreInput] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchScores = async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    
    try {
      const { data, error } = await supabase
        .from('scores')
        .select('*')
        .order('score', { ascending: false });

      if (error) {
        console.error('Error fetching scores:', error);
      } else {
        setScores(data || []);
      }
    } catch (error) {
      console.error('Failed to fetch scores:', error);
    } finally {
      if (isManualRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchScores();
    
    // Auto-refresh every 1 minute (60 seconds)
    const interval = setInterval(() => {
      fetchScores();
    }, 60000);

    // Cleanup interval on component unmount
    return () => clearInterval(interval);
  }, []);

  const handleScoreAdded = () => {
    fetchScores();
    setShowScoreInput(false);
  };

  if (showScoreInput) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl" style={{ minHeight: '100vh', backgroundColor: '#FAFAD2' }}>
        <header className="text-center mb-12 minecraft-panel bg-minecraft-gold p-6 animate-float">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Trophy className="w-12 h-12 text-minecraft-obsidian diamond-glow animate-glow" />
            <h1 className="text-2xl md:text-3xl font-minecraft font-bold text-minecraft-obsidian" style={{ textShadow: '3px 3px 0 rgba(255,255,255,0.5)' }}>Add New Score</h1>
          </div>
          <button
            onClick={() => setShowScoreInput(false)}
            className="minecraft-btn text-xs font-minecraft bg-minecraft-wood text-white hover:brightness-110"
          >
            <span style={{ textShadow: '2px 2px 0 rgba(0,0,0,0.7)' }}>← Leaderboard</span>
          </button>
        </header>

        <ScoreInput onScoreAdded={handleScoreAdded} userName={user.name} userCollege={user.college} />
      </div>
    );
  }

  return (
    <div id="scores" className="container mx-auto px-4 py-8 max-w-4xl" style={{ minHeight: '100vh', backgroundColor: '#FAFAD2' }}>
      <header className="text-center mb-12 minecraft-panel bg-minecraft-gold p-6 animate-float">
        <div className="flex items-center justify-center gap-3 mb-4">
          <h1 className="text-2xl md:text-3xl font-minecraft font-bold text-minecraft-obsidian" style={{ textShadow: '3px 3px 0 rgba(255,255,255,0.5)' }}>Leaderboard</h1>
        </div>

        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => setShowScoreInput(true)}
            className="minecraft-btn bg-minecraft-grass grass-texture hover:brightness-110 text-white font-minecraft text-xs py-3 px-6 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2"
          >
            <Plus size={20} />
            <span style={{ textShadow: '2px 2px 0 rgba(0,0,0,0.7)' }}>Enter Score</span>
          </button>
          <button
            onClick={() => fetchScores(true)}
            disabled={refreshing}
            className="minecraft-btn bg-minecraft-emerald hover:brightness-110 disabled:bg-gray-600 text-white font-minecraft text-xs py-3 px-6 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2"
          >
            <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
            <span style={{ textShadow: '2px 2px 0 rgba(0,0,0,0.7)' }}>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </header>

      <ScoreDisplay scores={scores} loading={loading} onScoreDeleted={fetchScores} />
    </div>
  );
}
