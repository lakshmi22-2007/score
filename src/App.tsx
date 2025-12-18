import { useEffect, useState } from 'react';
import { Trophy } from 'lucide-react';
import { supabase } from './lib/supabase';
import { ScoreInput } from './components/ScoreInput';
import { ScoreDisplay } from './components/ScoreDisplay';
import { CodeSandbox } from './components/CodeSandbox';
import { Navbar } from './components/Navbar';
import type { Score } from './types/score';

function App() {
  const [scores, setScores] = useState<Score[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchScores = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('scores')
      .select('*')
      .order('score', { ascending: false });

    if (error) {
      console.error('Error fetching scores:', error);
    } else {
      setScores(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchScores();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <Navbar />
      
      <div id="sandbox">
        <CodeSandbox />
      </div>
      
      <div id="scores" className="container mx-auto px-4 py-8 max-w-4xl">
        <header className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Trophy className="w-12 h-12 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">Score Tracker</h1>
          </div>
          <p className="text-gray-600">Submit scores in JSON format and view the leaderboard</p>
        </header>

        <ScoreInput onScoreAdded={fetchScores} />
        <ScoreDisplay scores={scores} loading={loading} onScoreDeleted={fetchScores} />
      </div>
    </div>
  );
}

export default App;
