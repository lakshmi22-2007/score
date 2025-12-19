import { useState, useEffect } from 'react';
import { Trophy, Calendar, User, Gamepad2, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Score } from '../types/score';

interface ScoreDisplayProps {
  scores: Score[];
  loading: boolean;
  onScoreDeleted: () => void;
}

export function ScoreDisplay({ scores, loading, onScoreDeleted }: ScoreDisplayProps) {
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [visibleScores, setVisibleScores] = useState<Score[]>(scores);

  useEffect(() => {
    setVisibleScores(scores);
  }, [scores]);

  const handleDelete = async (id: string) => {
    const previousScores = visibleScores;
    setVisibleScores(visibleScores.filter(score => score.id !== id));
    setDeleting(id);
    setDeleteError(null);

    try {
      const { error } = await supabase
        .from('scores')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setDeleting(null);
      onScoreDeleted();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete score');
      setVisibleScores(previousScores);
      setDeleting(null);
    }
  };
  if (loading && visibleScores.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
        </div>
      </div>
    );
  }

  if (visibleScores.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8">
        <p className="text-center text-gray-500">No scores yet. Add your first score above!</p>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getMedalColor = (index: number) => {
    if (index === 0) return 'text-yellow-500';
    if (index === 1) return 'text-gray-400';
    if (index === 2) return 'text-orange-600';
    return 'text-gray-300';
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Leaderboard</h2>

      {deleteError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{deleteError}</p>
        </div>
      )}

      <div className="grid gap-4">
        {visibleScores.map((score, index) => (
          <div
            key={score.id}
            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-200"
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <Trophy className={`w-8 h-8 ${getMedalColor(index)}`} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4 mb-3">
      
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <h3 className="text-lg font-bold text-gray-900">{score.player_name}</h3>
                    </div>
                  

                  <div className="flex items-start gap-3">
                    <div className="text-right">
                      <div className="text-3xl font-bold text-blue-600">{score.score.toLocaleString()}</div>
                      <div className="text-xs text-gray-500">points</div>
                    </div>
                    <button
                      onClick={() => handleDelete(score.id)}
                      disabled={deleting === score.id}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Delete score"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                {Object.keys(score.metadata).length > 0 && (
                  <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                    <div className="text-xs font-medium text-gray-600 mb-2">Additional Info:</div>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(score.metadata).map(([key, value]) => (
                        <div key={key} className="text-sm">
                          <span className="text-gray-500">{key}:</span>{' '}
                          <span className="text-gray-700 font-medium">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Calendar className="w-3 h-3" />
                  <span>{formatDate(score.created_at)}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
