import { useEffect, useState } from 'react';
import { Trophy, Plus } from 'lucide-react';
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

  const fetchScores = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('scores')
      .select('*')
      .order('score', { ascending: false });

    if (error) {
      // Error fetching scores
    } else {
      setScores(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchScores();
    
    // Auto-refresh every 60 seconds
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
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <header className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Trophy className="w-12 h-12 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">Add New Score</h1>
          </div>
          <button
            onClick={() => setShowScoreInput(false)}
            className="text-blue-600 hover:text-blue-700 font-semibold"
          >
            ← Leaderboard
          </button>
        </header>

        <ScoreInput onScoreAdded={handleScoreAdded} userName={user.name} userCollege={user.college} />
      </div>
    );
  }

  return (
    <div id="scores" className="container mx-auto px-4 py-8 max-w-4xl">
      <header className="text-center mb-12">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Trophy className="w-12 h-12 text-blue-600" />
          <h1 className="text-4xl font-bold text-gray-900">Leaderboard</h1>
        </div>
        <button
          onClick={() => setShowScoreInput(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl flex items-center gap-2 mx-auto"
        >
          <Plus size={20} />
          Enter Score
        </button>
      </header>

      <ScoreDisplay scores={scores} loading={loading} onScoreDeleted={fetchScores} />
    </div>
  );
}
