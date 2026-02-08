import { useEffect, useState, useCallback, useRef } from 'react';
import { Trophy, Plus, RefreshCw, Save, Code, Users, Eye, GraduationCap, X } from 'lucide-react';
import { apiClient } from '../lib/api';
import { ScoreInput } from '../components/ScoreInput';
import { ScoreDisplay } from '../components/ScoreDisplay';
import type { Score } from '../types/score';

interface AdminProps {
  user: { name: string; college: string };
}

interface SavedCode {
  id: string;
  user_name: string;
  html_code: string;
  css_code: string;
  updated_at: string;
}

interface Team {
  id: string;
  team_name: string;
  college_name: string;
  phone_no: string;
  created_at: string;
}

export function Admin({ user }: AdminProps) {
  const [scores, setScores] = useState<Score[]>([]);
  const [loading, setLoading] = useState(true);
  const [showScoreInput, setShowScoreInput] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // New State for Saved Codes and Teams
  const [showSavedCodes, setShowSavedCodes] = useState(false);
  const [savedCodes, setSavedCodes] = useState<SavedCode[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [viewingCode, setViewingCode] = useState<SavedCode | null>(null);
  
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const fetchScores = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const { data, error } = await apiClient.getScores();
      if (error) console.error('Error fetching scores:', error);
      else if (data && Array.isArray(data)) setScores(data);
      
      // Also fetch teams if requested manually
      if (isManualRefresh) {
         fetchTeams();
      }
    } catch (error) {
      console.error('Failed to fetch scores:', error);
    } finally {
      if (isManualRefresh) setRefreshing(false);
      else setLoading(false);
    }
  }, []);
  
  const fetchSavedCodes = async () => {
    setLoading(true);
    try {
      const { data, error } = await apiClient.getAllSavedCodes();
      if (data && !error) {
        setSavedCodes(data as any);
        setShowSavedCodes(true);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeams = useCallback(async () => {
    try {
      const { data, error } = await apiClient.getTeams();
      if (data && Array.isArray(data)) {
        setTeams(data as unknown as Team[]);
      } else if (error) {
        console.error('Error fetching teams:', error);
      }
    } catch (e) {
      console.error('Fetch teams error:', e);
    }
  }, []);

  useEffect(() => {
    fetchScores();
    fetchTeams();
  }, [fetchScores, fetchTeams]);

  useEffect(() => {
    if (viewingCode && iframeRef.current) {
        const content = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { margin: 0; padding: 16px; font-family: system-ui, -apple-system, sans-serif; }
    ${viewingCode.css_code || ''}
  </style>
</head>
<body>
  ${viewingCode.html_code || '<p style="color: #999;">No HTML content</p>'}
</body>
</html>`;
      iframeRef.current.srcdoc = content;
    }
  }, [viewingCode]);

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
    <div id="scores" className="w-full px-6 py-8" style={{ minHeight: '100vh', backgroundColor: '#FAFAD2' }}>
      <header className="max-w-4xl mx-auto text-center mb-8 minecraft-panel bg-minecraft-gold p-6 animate-float">
        <div className="flex items-center justify-center gap-3 mb-4">
          <h1 className="text-2xl md:text-3xl font-minecraft font-bold text-minecraft-obsidian" style={{ textShadow: '3px 3px 0 rgba(255,255,255,0.5)' }}>
            {showSavedCodes ? 'Scoreboard & Teams' : 'Leaderboard'}
          </h1>
        </div>

        <div className="flex items-center justify-center gap-4 flex-wrap">
          <button
            onClick={() => setShowScoreInput(true)}
            className="minecraft-btn bg-minecraft-grass grass-texture hover:brightness-110 text-white font-minecraft text-xs py-3 px-6 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2"
          >
            <Plus size={20} />
            <span style={{ textShadow: '2px 2px 0 rgba(0,0,0,0.7)' }}>Enter Score</span>
          </button>
          
          <button
            onClick={() => { 
              const newState = !showSavedCodes;
              setShowSavedCodes(newState); 
              if(newState) {
                fetchSavedCodes();
                fetchTeams();
              }
            }}
            className={`minecraft-btn hover:brightness-110 text-white font-minecraft text-xs py-3 px-6 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2 ${showSavedCodes ? 'bg-minecraft-wood' : 'bg-minecraft-diamond'}`}
          >
            {showSavedCodes ? <Trophy size={20} /> : <Code size={20} />}
            <span style={{ textShadow: '2px 2px 0 rgba(0,0,0,0.7)' }}>
              {showSavedCodes ? 'Show Leaderboard' : 'View Scoreboard'}
            </span>
          </button>

          <button
            onClick={() => { fetchScores(true); fetchTeams(); }}
            disabled={refreshing}
            className="minecraft-btn bg-minecraft-emerald hover:brightness-110 disabled:bg-gray-600 text-white font-minecraft text-xs py-3 px-6 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2"
          >
            <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
            <span style={{ textShadow: '2px 2px 0 rgba(0,0,0,0.7)' }}>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </header>

      {/* Saved Codes & Teams View */}
      {showSavedCodes ? (
        <div className="space-y-12 animate-slide-in w-full">
           {/* Saved Codes Table */}
           <div className="minecraft-panel bg-minecraft-wood wood-texture p-6 w-full">
             <div className="flex justify-between items-center mb-4">
               <h2 className="text-xl font-minecraft text-white flex items-center gap-2">
                 <Save className="text-minecraft-gold" />
                 Saved Code Snapshots
               </h2>
               {viewingCode && (
                 <button onClick={() => setViewingCode(null)} className="minecraft-btn bg-minecraft-redstone text-white p-2">
                   <X size={16} /> Close Preview
                 </button>
               )}
             </div>

             <div className="flex flex-col lg:flex-row gap-6">
                <div className={`flex-1 overflow-auto max-h-[600px] ${viewingCode ? 'lg:w-1/3' : 'w-full'}`}>
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-minecraft-stone sticky top-0">
                      <tr>
                        <th className="p-3 text-xs font-minecraft text-minecraft-gold">User</th>
                        <th className="p-3 text-xs font-minecraft text-minecraft-gold">Last Saved</th>
                        <th className="p-3 text-xs font-minecraft text-minecraft-gold text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-minecraft-stone/30">
                      {savedCodes.map((code) => (
                        <tr key={code.id} className="hover:bg-black/20 transition-colors">
                          <td className="p-3 font-minecraft text-sm text-white">{code.user_name}</td>
                          <td className="p-3 text-xs text-gray-300">{new Date(code.updated_at).toLocaleString()}</td>
                          <td className="p-3 text-center">
                            <button 
                              onClick={() => setViewingCode(code)}
                              className="minecraft-btn bg-minecraft-lapis p-2 text-white hover:brightness-110"
                            >
                              <Eye size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {savedCodes.length === 0 && (
                        <tr><td colSpan={3} className="p-4 text-center text-gray-400 font-minecraft text-xs">No saved codes found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {viewingCode && (
                  <div className="flex-1 lg:w-2/3 minecraft-panel bg-minecraft-stone overflow-hidden flex flex-col h-[600px]">
                     <div className="p-2 bg-minecraft-obsidian text-white font-minecraft text-xs flex justify-between">
                        <span>Previewing: {viewingCode.user_name}</span>
                     </div>
                     <iframe 
                       ref={iframeRef}
                       className="flex-1 bg-white w-full"
                       title="Saved Code Preview"
                       sandbox="allow-scripts"
                     />
                  </div>
                )}
             </div>
           </div>

           {/* Teams Table Section */}
           <div className="minecraft-panel bg-minecraft-stone stone-texture p-6 w-full">
              <h2 className="text-xl font-minecraft text-white mb-4 flex items-center gap-2" style={{ textShadow: '2px 2px 0 rgba(0,0,0,0.7)' }}>
                <Users className="text-minecraft-diamond" />
                Registered Teams
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b-4 border-minecraft-obsidian">
                      <th className="p-3 text-xs font-minecraft text-minecraft-gold">Team Name</th>
                      <th className="p-3 text-xs font-minecraft text-minecraft-gold">College</th>
                      <th className="p-3 text-xs font-minecraft text-minecraft-gold">Contact</th>
                      <th className="p-3 text-xs font-minecraft text-minecraft-gold">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-minecraft-obsidian/30">
                    {teams.map((team) => (
                      <tr key={team.id} className="hover:bg-black/10 transition-colors">
                        <td className="p-3 font-minecraft text-sm text-white font-bold">{team.team_name}</td>
                        <td className="p-3 text-xs text-gray-200 flex items-center gap-2">
                          <GraduationCap size={14} className="text-minecraft-iron" />
                          {team.college_name}
                        </td>
                        <td className="p-3 text-xs text-gray-200">{team.phone_no}</td>
                        <td className="p-3 text-xs text-gray-400">
                          {team.created_at ? new Date(team.created_at).toLocaleDateString() : '-'}
                        </td>
                      </tr>
                    ))}
                    {teams.length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-6 text-center text-white font-minecraft text-xs">No teams registered yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
           </div>
        </div>
      ) : (
        /* Main Leaderboard Table */
        <ScoreDisplay scores={scores} loading={loading} onScoreDeleted={fetchScores} />
      )}

    </div>
  );
}
