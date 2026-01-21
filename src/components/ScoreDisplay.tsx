import { useState, useEffect, useRef } from 'react';
import { Trophy, Calendar, User, Gamepad2, Trash2, Edit2, Save, X, Eye, ChevronDown, ChevronUp } from 'lucide-react';
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Score>>({});
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [viewingResultId, setViewingResultId] = useState<string | null>(null);
  const [expandedMetadata, setExpandedMetadata] = useState<Set<string>>(new Set());
  const iframeRef = useRef<HTMLIFrameElement>(null);

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

  const handleEdit = (score: Score) => {
    setEditingId(score.id);
    setEditForm({
      player_name: score.player_name,
      score: score.score,
      description: score.description,
      metadata: { ...score.metadata },
    });
    setEditError(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({});
    setEditError(null);
  };

  const handleSaveEdit = async (id: string) => {
    setSaving(true);
    setEditError(null);

    try {
      // Update only editable fields in database (player_name, score, description)
      // Metadata is kept unchanged
      const { data, error } = await supabase
        .from('scores')
        .update({
          player_name: editForm.player_name,
          score: editForm.score,
          description: editForm.description,
        })
        .eq('id', id)
        .select();

      if (error) {
        console.error('Database update error:', error);
        throw error;
      }

      console.log('Update successful:', data);

      // Close the edit form first
      setSaving(false);
      setEditingId(null);
      setEditForm({});
      
      // Then refresh from database to get the latest data
      onScoreDeleted();
    } catch (err) {
      console.error('Save edit error:', err);
      setEditError(err instanceof Error ? err.message : 'Failed to update score');
      setSaving(false);
    }
  };

  const updateMetadataField = (key: string, value: string) => {
    setEditForm({
      ...editForm,
      metadata: {
        ...editForm.metadata,
        [key]: value,
      },
    });
  };

  const addMetadataField = () => {
    const newKey = prompt('Enter new field name:');
    if (newKey && newKey.trim()) {
      updateMetadataField(newKey.trim(), '');
    }
  };

  const removeMetadataField = (key: string) => {
    const { [key]: removed, ...rest } = editForm.metadata as Record<string, unknown>;
    setEditForm({
      ...editForm,
      metadata: rest,
    });
  };

  const handleViewResult = (score: Score) => {
    setViewingResultId(score.id);
    
    // Render the HTML/CSS in iframe
    setTimeout(() => {
      const iframe = iframeRef.current;
      if (!iframe || !score.html_code) return;

      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) return;

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

      iframeDoc.open();
      iframeDoc.write(content);
      iframeDoc.close();

      // Adjust iframe height based on content
      setTimeout(() => {
        const body = iframeDoc.body;
        const html = iframeDoc.documentElement;
        const height = Math.max(
          body.scrollHeight,
          body.offsetHeight,
          html.clientHeight,
          html.scrollHeight,
          html.offsetHeight
        );
        if (iframe && height > 0) {
          iframe.style.height = Math.min(Math.max(200, height + 40), 800) + 'px';
        }
      }, 100);
    }, 100);
  };

  const handleCloseResult = () => {
    setViewingResultId(null);
  };

  const toggleMetadata = (scoreId: string) => {
    setExpandedMetadata(prev => {
      const newSet = new Set(prev);
      if (newSet.has(scoreId)) {
        newSet.delete(scoreId);
      } else {
        newSet.add(scoreId);
      }
      return newSet;
    });
  };
  
  if (loading && visibleScores.length === 0) {
    return (
      <div className="minecraft-panel bg-minecraft-stone stone-texture p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-minecraft-diamond border-t-transparent"></div>
        </div>
      </div>
    );
  }

  if (visibleScores.length === 0) {
    return (
      <div className="minecraft-panel bg-minecraft-wood wood-texture p-8">
        <p className="text-center text-xs font-minecraft text-white" style={{ textShadow: '2px 2px 0 rgba(0,0,0,0.7)' }}>No scores yet. Add your first score!</p>
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
    if (index === 0) return 'text-minecraft-gold';
    if (index === 1) return 'text-minecraft-iron';
    if (index === 2) return 'text-minecraft-wood';
    return 'text-gray-300';
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-minecraft font-bold text-white mb-4" style={{ textShadow: '3px 3px 0 rgba(0,0,0,0.7)' }}>Leaderboard</h2>

      {deleteError && (
        <div className="minecraft-panel p-4 bg-minecraft-redstone">
          <p className="text-xs font-minecraft text-white" style={{ textShadow: '2px 2px 0 rgba(0,0,0,0.7)' }}>{deleteError}</p>
        </div>
      )}

      {editError && (
        <div className="minecraft-panel p-4 bg-minecraft-redstone">
          <p className="text-xs font-minecraft text-white" style={{ textShadow: '2px 2px 0 rgba(0,0,0,0.7)' }}>{editError}</p>
        </div>
      )}

      <div className="grid gap-4">
        {visibleScores.map((score, index) => (
          <div
            key={score.id}
            className="minecraft-panel bg-minecraft-wood wood-texture p-6 hover:brightness-110 transition-all duration-200"
          >
            {editingId === score.id ? (
              // Edit Mode
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-minecraft font-bold text-white" style={{ textShadow: '2px 2px 0 rgba(0,0,0,0.7)' }}>Edit Score</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSaveEdit(score.id)}
                      disabled={saving}
                      className="minecraft-btn flex items-center gap-2 px-4 py-2 bg-minecraft-emerald hover:brightness-110 text-white text-xs font-minecraft transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Save size={16} />
                      <span style={{ textShadow: '2px 2px 0 rgba(0,0,0,0.7)' }}>{saving ? 'Saving...' : 'Save'}</span>
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      disabled={saving}
                      className="minecraft-btn flex items-center gap-2 px-4 py-2 bg-minecraft-stone hover:brightness-110 text-white text-xs font-minecraft transition-all duration-200 disabled:opacity-50"
                    >
                      <X size={16} />
                      <span style={{ textShadow: '2px 2px 0 rgba(0,0,0,0.7)' }}>Cancel</span>
                    </button>
                  </div>
                </div>

                <div className="grid gap-4">
                  <div>
                    <label className="block text-xs font-minecraft text-white mb-1" style={{ textShadow: '2px 2px 0 rgba(0,0,0,0.7)' }}>
                      Player Name
                    </label>
                    <input
                      type="text"
                      value={editForm.player_name || ''}
                      onChange={(e) => setEditForm({ ...editForm, player_name: e.target.value })}
                      className="minecraft-panel w-full px-3 py-2 bg-minecraft-obsidian text-white font-minecraft text-xs focus:ring-4 focus:ring-minecraft-diamond"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-minecraft text-white mb-1" style={{ textShadow: '2px 2px 0 rgba(0,0,0,0.7)' }}>
                      Score
                    </label>
                    <input
                      type="number"
                      value={editForm.score || 0}
                      onChange={(e) => setEditForm({ ...editForm, score: parseInt(e.target.value) || 0 })}
                      className="minecraft-panel w-full px-3 py-2 bg-minecraft-obsidian text-white font-minecraft text-xs focus:ring-4 focus:ring-minecraft-diamond"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-minecraft text-white mb-1" style={{ textShadow: '2px 2px 0 rgba(0,0,0,0.7)' }}>
                      Description
                    </label>
                    <textarea
                      value={editForm.description || ''}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      className="minecraft-panel w-full px-3 py-2 bg-minecraft-obsidian text-white font-minecraft text-xs focus:ring-4 focus:ring-minecraft-diamond"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-minecraft text-white mb-2" style={{ textShadow: '2px 2px 0 rgba(0,0,0,0.7)' }}>
                      Metadata                    </label>
                    <div className="minecraft-panel p-3 bg-minecraft-dirt wood-texture">
                      {Object.entries(editForm.metadata || {}).length > 0 ? (
                        <div className="grid grid-cols-2 gap-2">
                          {Object.entries(editForm.metadata || {}).map(([key, value]) => (
                            <div key={key} className="text-xs font-minecraft text-white" style={{ textShadow: '1px 1px 0 rgba(0,0,0,0.7)' }}>
                              <span className="text-gray-500 font-medium">{key}:</span>{' '}
                              <span className="text-gray-700">{String(value)}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No metadata available</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // View Mode
              <div className="flex items-start gap-4">
                {/* Left side - Score info */}
                <div className={`flex items-start gap-4 ${viewingResultId === score.id ? 'flex-1' : 'w-full'}`}>
                <div className="flex-shrink-0">
                  <Trophy className={`w-8 h-8 ${getMedalColor(index)}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4 text-white" />
                      <h3 className="text-sm md:text-base font-minecraft font-bold text-white" style={{ textShadow: '2px 2px 0 rgba(0,0,0,0.7)' }}>{score.player_name}</h3>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="text-right">
                        <div className="text-2xl font-minecraft font-bold text-minecraft-gold" style={{ textShadow: '2px 2px 0 rgba(0,0,0,0.7)' }}>{score.score.toLocaleString()}</div>
                        <div className="text-xs font-minecraft text-white" style={{ textShadow: '1px 1px 0 rgba(0,0,0,0.7)' }}>points</div>
                      </div>
                      {score.html_code && (
                        <button
                          onClick={() => handleViewResult(score)}
                          className="minecraft-btn p-2 bg-minecraft-lapis hover:brightness-110 text-white transition-all duration-200"
                          title="View Result"
                        >
                          <Eye size={18} />
                        </button>
                      )}
                      <button
                        onClick={() => handleEdit(score)}
                        className="minecraft-btn p-2 bg-minecraft-diamond hover:brightness-110 text-white transition-all duration-200"
                        title="Edit score"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(score.id)}
                        disabled={deleting === score.id}
                        className="minecraft-btn p-2 bg-minecraft-redstone hover:brightness-110 text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Delete score"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  {Object.keys(score.metadata).length > 0 && (
                    <div className="mb-3">
                      <button
                        onClick={() => toggleMetadata(score.id)}
                        className="minecraft-btn flex items-center gap-2 w-full p-3 bg-minecraft-dirt hover:brightness-110 transition-all"
                      >
                        <span className="text-xs font-minecraft text-white" style={{ textShadow: '1px 1px 0 rgba(0,0,0,0.7)' }}>Additional Info</span>
                        {expandedMetadata.has(score.id) ? (
                          <ChevronUp size={14} className="text-white" />
                        ) : (
                          <ChevronDown size={14} className="text-white" />
                        )}
                        <span className="text-xs font-minecraft text-minecraft-gold" style={{ textShadow: '1px 1px 0 rgba(0,0,0,0.7)' }}>({Object.keys(score.metadata).length} fields)</span>
                      </button>
                      {expandedMetadata.has(score.id) && (
                        <div className="mt-2 minecraft-panel p-3 bg-minecraft-obsidian">
                          <div className="grid grid-cols-2 gap-2">
                            {Object.entries(score.metadata).map(([key, value]) => (
                              <div key={key} className="text-xs font-minecraft text-white" style={{ textShadow: '1px 1px 0 rgba(0,0,0,0.7)' }}>
                                <span className="text-minecraft-gold">{key}:</span>{' '}
                                <span className="text-gray-700 font-medium">{String(value)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-xs font-minecraft text-minecraft-gold">
                    <Calendar className="w-3 h-3" />
                    <span style={{ textShadow: '1px 1px 0 rgba(0,0,0,0.7)' }}>{formatDate(score.created_at)}</span>
                  </div>
                </div>
              </div>

                {/* Right side - Code Preview (if viewing) */}
                {viewingResultId === score.id && score.html_code && (
                  <div className="flex-1 min-w-0 minecraft-panel border-l-4 border-black pl-4 bg-minecraft-stone stone-texture">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-minecraft text-white" style={{ textShadow: '2px 2px 0 rgba(0,0,0,0.7)' }}>Code Preview</h4>
                      <button
                        onClick={handleCloseResult}
                        className="minecraft-btn p-1 bg-minecraft-redstone hover:brightness-110 text-white transition-all"
                        title="Close preview"
                      >
                        <X size={16} />
                      </button>
                    </div>
                    <iframe
                      ref={iframeRef}
                      sandbox="allow-scripts allow-same-origin"
                      className="w-full minecraft-panel bg-white transition-all duration-300"
                        style={{ minHeight: '200px', maxHeight: '800px' }}
                      title="Code Result"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
