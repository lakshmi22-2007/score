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

      {editError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{editError}</p>
        </div>
      )}

      <div className="grid gap-4">
        {visibleScores.map((score, index) => (
          <div
            key={score.id}
            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-200"
          >
            {editingId === score.id ? (
              // Edit Mode
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Edit Score</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSaveEdit(score.id)}
                      disabled={saving}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Save size={16} />
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      disabled={saving}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors duration-200 disabled:opacity-50"
                    >
                      <X size={16} />
                      Cancel
                    </button>
                  </div>
                </div>

                <div className="grid gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Player Name
                    </label>
                    <input
                      type="text"
                      value={editForm.player_name || ''}
                      onChange={(e) => setEditForm({ ...editForm, player_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Score
                    </label>
                    <input
                      type="number"
                      value={editForm.score || 0}
                      onChange={(e) => setEditForm({ ...editForm, score: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={editForm.description || ''}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Metadata                    </label>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      {Object.entries(editForm.metadata || {}).length > 0 ? (
                        <div className="grid grid-cols-2 gap-2">
                          {Object.entries(editForm.metadata || {}).map(([key, value]) => (
                            <div key={key} className="text-sm">
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
                      <User className="w-4 h-4 text-gray-400" />
                      <h3 className="text-lg font-bold text-gray-900">{score.player_name}</h3>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="text-right">
                        <div className="text-3xl font-bold text-blue-600">{score.score.toLocaleString()}</div>
                        <div className="text-xs text-gray-500">points</div>
                      </div>
                      {score.html_code && (
                        <button
                          onClick={() => handleViewResult(score)}
                          className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors duration-200"
                          title="View Result"
                        >
                          <Eye size={18} />
                        </button>
                      )}
                      <button
                        onClick={() => handleEdit(score)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                        title="Edit score"
                      >
                        <Edit2 size={18} />
                      </button>
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
                    <div className="mb-3">
                      <button
                        onClick={() => toggleMetadata(score.id)}
                        className="flex items-center gap-2 w-full p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <span className="text-xs font-medium text-gray-600">Additional Info</span>
                        {expandedMetadata.has(score.id) ? (
                          <ChevronUp size={14} className="text-gray-600" />
                        ) : (
                          <ChevronDown size={14} className="text-gray-600" />
                        )}
                        <span className="text-xs text-gray-400">({Object.keys(score.metadata).length} fields)</span>
                      </button>
                      {expandedMetadata.has(score.id) && (
                        <div className="mt-2 p-3 bg-gray-50 rounded-lg border-l-4 border-blue-500">
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
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDate(score.created_at)}</span>
                  </div>
                </div>
              </div>

                {/* Right side - Code Preview (if viewing) */}
                {viewingResultId === score.id && score.html_code && (
                  <div className="flex-1 min-w-0 border-l-2 border-gray-200 pl-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold text-gray-700">Code Preview</h4>
                      <button
                        onClick={handleCloseResult}
                        className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                        title="Close preview"
                      >
                        <X size={16} />
                      </button>
                    </div>
                    <iframe
                      ref={iframeRef}
                      sandbox="allow-scripts allow-same-origin"
                      className="w-full border-2 border-gray-300 rounded-lg bg-white transition-all duration-300"
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
