import { useState } from 'react';
import { Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { ScoreInput } from '../types/score';
import { compareOutputs } from '../lib/scoring';

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

      const parsedAny = parsed as any;
      if (!parsedAny.player_name || !parsedAny.description) {
        setError('JSON must include: player_name (string) and description (string). Score is optional and will be computed when submitting code.');
        setLoading(false);
        return;
      }

      const {
        player_name: playerName,
        description: desc,
        score: providedScoreRaw,
        question_id,
        submitted_html,
        submitted_css,
        ...metadata
      } = parsedAny;

      const providedScore = typeof providedScoreRaw === 'number' ? providedScoreRaw : undefined;
      let finalScore = providedScore;

      // If a question id (UUID or round number) and submitted code are provided, fetch expected output and compute score
      if ((question_id || question_id === 0) && (submitted_html || submitted_css)) {
        try {
          // Support passing either the question UUID or the round number
          let qQuery = supabase.from('questions').select('*');
          const qIsUuid = typeof question_id === 'string' && question_id.includes('-');
          if (qIsUuid) {
            qQuery = qQuery.eq('id', question_id).single();
          } else {
            // treat as round number
            const roundNo = typeof question_id === 'number' ? question_id : parseInt(String(question_id), 10);
            if (Number.isNaN(roundNo)) throw new Error('Invalid question identifier');
            qQuery = qQuery.eq('round_no', roundNo).single();
          }

          const { data: qdata, error: qerr } = await qQuery as any;

          if (qerr || !qdata) throw qerr || new Error('Question not found');

          const expectedHtml = qdata?.html_code || '';
          const expectedCss = qdata?.css_code || '';

          const result = await compareOutputs(expectedHtml, expectedCss, submitted_html || '', submitted_css || '');
          finalScore = result.score;
          metadata.scoring = result;
        } catch (err) {
          // scoring failure shouldn't block insert; store error in metadata
          metadata.scoring_error = err instanceof Error ? err.message : String(err);
        }
      }

      let scoreToInsert = typeof finalScore === 'number' ? finalScore : providedScore;
      if (typeof scoreToInsert !== 'number') {
        // ensure DB receives a numeric score (scores table has DEFAULT 0)
        scoreToInsert = 0;
      }

      const player_name = playerName;
      const description = desc;

      const { error: dbError } = await supabase
        .from('scores')
        .insert({
          player_name,
          score: scoreToInsert,
          description,
          name: userName,
          college: userCollege,
          metadata: metadata,
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
    // score is optional; include when known or let system compute from submitted code
    description: "Space Quest",
    level: 15,
    time_played: "45:30"
  };

  return (
    <div className="minecraft-panel bg-minecraft-wood wood-texture p-6 mb-8">
      <h2 className="text-xl font-minecraft font-bold text-white mb-4" style={{ textShadow: '3px 3px 0 rgba(0,0,0,0.7)' }}>Add New Score</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="json-input" className="block text-xs font-minecraft text-white mb-2" style={{ textShadow: '2px 2px 0 rgba(0,0,0,0.7)' }}>
            JSON Input
          </label>
          <textarea
            id="json-input"
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder={JSON.stringify(exampleJson, null, 2)}
            className="minecraft-panel w-full h-48 px-4 py-3 bg-minecraft-obsidian text-white font-mono text-sm focus:ring-4 focus:ring-minecraft-diamond"
            required
          />
            <p className="mt-2 text-xs font-minecraft text-minecraft-gold" style={{ textShadow: '1px 1px 0 rgba(0,0,0,0.7)' }}>
            Required: player_name, description. Optional: score or question_id + code
          </p>
        </div>

        {error && (
          <div className="minecraft-panel p-4 bg-minecraft-redstone">
            <p className="text-xs font-minecraft text-white" style={{ textShadow: '2px 2px 0 rgba(0,0,0,0.7)' }}>{error}</p>
          </div>
        )}

        {success && (
          <div className="minecraft-panel p-4 bg-minecraft-emerald grass-texture">
            <p className="text-xs font-minecraft text-white" style={{ textShadow: '2px 2px 0 rgba(0,0,0,0.7)' }}>{success}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="minecraft-btn w-full bg-minecraft-gold hover:brightness-110 text-minecraft-obsidian font-minecraft text-xs py-3 px-6 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed animate-glow"
        >
          <Plus size={20} />
          <span style={{ textShadow: '2px 2px 0 rgba(255,255,255,0.5)' }}>{loading ? 'Adding...' : 'Add Score'}</span>
        </button>
      </form>
    </div>
  );
}
