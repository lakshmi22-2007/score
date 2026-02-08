import { useState, useEffect, useRef } from 'react';
import { Calendar, Phone, GraduationCap, Trash2, Edit2, Save, X, Eye } from 'lucide-react';
import { apiClient } from '../lib/api';
import type { Score } from '../types/score';

interface ScoreDisplayProps {
  scores: Score[];
  loading: boolean;
  onScoreDeleted: () => void;
}

export function ScoreDisplay({ scores, loading, onScoreDeleted }: ScoreDisplayProps) {
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [visibleScores, setVisibleScores] = useState<Score[]>(scores);

  // Panel State
  const [selectedScoreId, setSelectedScoreId] = useState<string | null>(null);
  const [panelMode, setPanelMode] = useState<'view' | 'edit' | null>(null);

  // Edit State
  const [editForm, setEditForm] = useState<Partial<Score>>({});
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    setVisibleScores(scores);
  }, [scores]);

  // Effect to update edit form when selection changes in edit mode
  useEffect(() => {
    if (selectedScoreId && panelMode === 'edit') {
      const score = visibleScores.find(s => s.id === selectedScoreId);
      if (score) {
        setEditForm({
          player_name: score.player_name,
          score: score.score,
          description: score.description,
          phone_no: score.phone_no,
          college: score.college,
          metadata: { ...score.metadata },
        });
      }
    }
  }, [selectedScoreId, panelMode, visibleScores]);

  // Effect to render iframe content when viewing
  useEffect(() => {
    if (selectedScoreId && panelMode === 'view') {
      const score = visibleScores.find(s => s.id === selectedScoreId);
      if (score && iframeRef.current) {
        const content = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { margin: 0; padding: 16px; font-family: system-ui, -apple-system, sans-serif; }
    ${score.css_code || ''}
  </style>
</head>
<body>
  ${score.html_code || '<p style="color: #999;">No HTML content</p>'}
</body>
</html>`;
        iframeRef.current.srcdoc = content;
      }
    }
  }, [selectedScoreId, panelMode, visibleScores]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this score?')) return;

    const previousScores = visibleScores;
    setVisibleScores(visibleScores.filter(score => score.id !== id));
    setDeleteError(null);

    // If deleting the currently selected item, close panel
    if (selectedScoreId === id) {
      closePanel();
    }

    try {
      const { error } = await apiClient.deleteScore(id);
      if (error) throw new Error(error);
      onScoreDeleted();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete score');
      setVisibleScores(previousScores);
    }
  };

  const openView = (id: string) => {
    setSelectedScoreId(id);
    setPanelMode('view');
  };

  const openEdit = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedScoreId(id);
    setPanelMode('edit');
    setEditError(null);
  };

  const closePanel = () => {
    setSelectedScoreId(null);
    setPanelMode(null);
    setEditForm({});
    setEditError(null);
  };

  const handleSaveEdit = async () => {
    if (!selectedScoreId) return;
    setSaving(true);
    setEditError(null);

    try {
      const { error } = await apiClient.updateScore(selectedScoreId, {
        player_name: editForm.player_name || '',
        score: editForm.score || 0,
        description: editForm.description || '',
      });

      if (error) throw new Error(error);

      setSaving(false);
      onScoreDeleted(); // Refresh list
      // Optionally switch back to view mode or keep open
      setPanelMode('view');
    } catch (err) {
      console.error('Save edit error:', err);
      setEditError(err instanceof Error ? err.message : 'Failed to update score');
      setSaving(false);
    }
  };

  const selectedScore = visibleScores.find(s => s.id === selectedScoreId);

  if (loading && visibleScores.length === 0) {
    return (
      <div className="minecraft-panel bg-minecraft-stone stone-texture p-8 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-minecraft-diamond border-t-transparent"></div>
      </div>
    );
  }

  if (visibleScores.length === 0) {
    return (
      <div className="minecraft-panel bg-minecraft-wood wood-texture p-8 text-center">
        <p className="text-xs font-minecraft text-white">No scores yet.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start h-[calc(100vh-200px)]">
      {/* Left Column: Table */}
      <div className={`flex-1 w-full flex flex-col h-full bg-minecraft-wood wood-texture minecraft-panel overflow-hidden transition-all duration-300`}>
        <div className="p-4 bg-minecraft-obsidian border-b-4 border-minecraft-wood flex justify-between items-center">
          <h2 className="text-lg font-minecraft text-white">Submissions ({visibleScores.length})</h2>
          {(deleteError || editError) && <span className="text-minecraft-redstone text-xs">{deleteError || editError}</span>}
        </div>

        <div className="overflow-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead className="bg-minecraft-stone sticky top-0 z-10 shadow-md">
              <tr>
                <th className="p-3 text-xs font-minecraft text-minecraft-gold uppercase tracking-wider w-16 text-center">Rank</th>
                <th className="p-3 text-xs font-minecraft text-minecraft-gold uppercase tracking-wider">Player</th>
                <th className="p-3 text-xs font-minecraft text-minecraft-gold uppercase tracking-wider hidden md:table-cell">Contact</th>
                <th className="p-3 text-xs font-minecraft text-minecraft-gold uppercase tracking-wider text-right">Score</th>
                <th className="p-3 text-xs font-minecraft text-minecraft-gold uppercase tracking-wider w-24 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-minecraft-stone/30">
              {visibleScores.map((score, index) => (
                <tr
                  key={score.id}
                  onClick={() => openView(score.id)}
                  className={`
                    cursor-pointer transition-colors duration-150 group
                    ${selectedScoreId === score.id ? 'bg-minecraft-stone/50' : 'hover:bg-black/10'}
                  `}
                >
                  <td className="p-3 text-center">
                    <span className={`font-minecraft font-bold ${index === 0 ? 'text-minecraft-gold text-lg' :
                      index === 1 ? 'text-minecraft-iron text-lg' :
                        index === 2 ? 'text-[#cd7f32] text-lg' : 'text-gray-400'
                      }`}>
                      {index + 1}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex flex-col">
                      <span className="font-minecraft text-sm text-white font-bold">{score.player_name}</span>
                      <span className="text-xs text-gray-300 flex items-center gap-1">
                        <GraduationCap size={10} />
                        {score.college || 'No College'}
                      </span>
                    </div>
                  </td>
                  <td className="p-3 hidden md:table-cell">
                    <div className="flex items-center gap-2 text-xs text-gray-300">
                      {score.phone_no ? (
                        <>
                          <Phone size={12} className="text-minecraft-emerald" />
                          <span>{score.phone_no}</span>
                        </>
                      ) : (
                        <span className="text-gray-500 italic">-</span>
                      )}
                    </div>
                  </td>
                  <td className="p-3 text-right">
                    <span className="font-minecraft text-minecraft-emerald font-bold text-lg">
                      {score.score}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center justify-center gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => openEdit(score.id, e)}
                        className="minecraft-btn p-1.5 bg-minecraft-lapis hover:brightness-110 text-white"
                        title="Edit"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={(e) => handleDelete(score.id, e)}
                        className="minecraft-btn p-1.5 bg-minecraft-redstone hover:brightness-110 text-white"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Right Column: Preview / Edit Panel */}
      {selectedScoreId && (
        <div className="w-full lg:w-[450px] flex-shrink-0 flex flex-col h-full bg-minecraft-stone stone-texture minecraft-panel overflow-hidden border-l-4 border-minecraft-obsidian animate-slide-in">
          <div className="p-3 bg-minecraft-obsidian flex justify-between items-center shadow-md">
            <h3 className="text-sm font-minecraft text-white flex items-center gap-2">
              {panelMode === 'view' ? <Eye size={16} className="text-minecraft-diamond" /> : <Edit2 size={16} className="text-minecraft-gold" />}
              {panelMode === 'view' ? 'Preview' : 'Edit Score'}
            </h3>
            <button onClick={closePanel} className="minecraft-btn p-1 bg-minecraft-redstone hover:brightness-110 text-white">
              <X size={16} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {panelMode === 'view' && selectedScore && (
              <div className="space-y-6">
                {/* Meta Info */}
                <div className="bg-black/20 p-4 rounded minecraft-panel border-2 border-minecraft-wood">
                  <div className="grid grid-cols-2 gap-4 text-xs mb-4">
                    <div>
                      <label className="text-gray-400 block mb-1">Player</label>
                      <div className="font-minecraft text-white">{selectedScore.player_name}</div>
                    </div>
                    <div>
                      <label className="text-gray-400 block mb-1">Score</label>
                      <div className="font-minecraft text-minecraft-emerald font-bold text-lg">{selectedScore.score}</div>
                    </div>
                    <div>
                      <label className="text-gray-400 block mb-1">College</label>
                      <div className="text-white flex items-center gap-1"><GraduationCap size={12} /> {selectedScore.college}</div>
                    </div>
                    <div>
                      <label className="text-gray-400 block mb-1">Phone</label>
                      <div className="text-white flex items-center gap-1"><Phone size={12} /> {selectedScore.phone_no || '-'}</div>
                    </div>
                    <div className="col-span-2">
                      <label className="text-gray-400 block mb-1">Submitted</label>
                      <div className="text-white flex items-center gap-1"><Calendar size={12} /> {new Date(selectedScore.created_at).toLocaleString()}</div>
                    </div>
                  </div>

                  {/* Metadata Accordion */}
                  {selectedScore.metadata && Object.keys(selectedScore.metadata).length > 0 && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <h4 className="text-xs font-minecraft text-minecraft-gold mb-2">AI Feedback & Metadata</h4>
                      <div className="text-xs text-gray-300 space-y-1">
                        {Object.entries(selectedScore.metadata).map(([k, v]) => (
                          <div key={k} className="flex gap-2">
                            <span className="text-gray-500 font-mono">{k}:</span>
                            <span className="truncate">{String(v)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Code Preview Frame */}
                <div className="flex flex-col h-64 md:h-96">
                  <label className="text-xs font-minecraft text-white mb-2">Live Output</label>
                  <iframe
                    ref={iframeRef}
                    className="flex-1 w-full bg-white minecraft-panel"
                    title="Preview"
                    sandbox="allow-scripts"
                  />
                </div>
              </div>
            )}

            {panelMode === 'edit' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-minecraft text-white mb-1">Player Name</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 bg-black/30 border-2 border-minecraft-wood text-white font-minecraft text-xs focus:border-minecraft-gold outline-none"
                    value={editForm.player_name || ''}
                    onChange={e => setEditForm({ ...editForm, player_name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-minecraft text-white mb-1">Score</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 bg-black/30 border-2 border-minecraft-wood text-white font-minecraft text-xs focus:border-minecraft-gold outline-none"
                    value={editForm.score || 0}
                    onChange={e => setEditForm({ ...editForm, score: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-minecraft text-white mb-1">Description/Notes</label>
                  <textarea
                    className="w-full px-3 py-2 bg-black/30 border-2 border-minecraft-wood text-white font-minecraft text-xs focus:border-minecraft-gold outline-none h-24"
                    value={editForm.description || ''}
                    onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                  />
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    onClick={handleSaveEdit}
                    disabled={saving}
                    className="flex-1 minecraft-btn py-3 bg-minecraft-emerald hover:brightness-110 text-white font-minecraft text-xs flex items-center justify-center gap-2"
                  >
                    <Save size={16} />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
