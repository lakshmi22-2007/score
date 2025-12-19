import { useState } from 'react';
import { Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { ScoreInput } from '../types/score';

interface ScoreInputProps {
  onScoreAdded: () => void;
  userName?: string;
  userCollege?: string;
}

export function ScoreInput({ onScoreAdded, userName, userCollege }: ScoreInputProps) {
  const [jsonInput, setJsonInput] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const parsed = JSON.parse(jsonInput) as ScoreInput;

      if (!parsed.player_name || typeof parsed.score !== 'number' || !parsed.description) {
        setError('JSON must include: player_name (string), score (number), and description (string)');
        setLoading(false);
        return;
      }

      const { player_name, score, description, ...metadata } = parsed;

      const { error: dbError } = await supabase
        .from('scores')
        .insert({
          player_name,
          score,
          description,
          name: userName,
          college: userCollege,
          metadata,
        });

      if (dbError) throw dbError;

      setSuccess('Score added successfully!');
      setJsonInput('');
      onScoreAdded();

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      if (err instanceof SyntaxError) {
        setError('Invalid JSON format');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to add score');
      }
    } finally {
      setLoading(false);
    }
  };

  const exampleJson = {
    player_name: "John Doe",
    score: 9500,
    description: "Space Quest",
    level: 15,
    time_played: "45:30"
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Add New Score</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="json-input" className="block text-sm font-medium text-gray-700 mb-2">
            JSON Input
          </label>
          <textarea
            id="json-input"
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder={JSON.stringify(exampleJson, null, 2)}
            className="w-full h-48 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
            required
          />
          <p className="mt-2 text-xs text-gray-500">
            Required fields: player_name, score, description. Additional fields will be stored as metadata.
          </p>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {success && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-600">{success}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus size={20} />
          {loading ? 'Adding Score...' : 'Add Score'}
        </button>
      </form>
    </div>
  );
}
