import { useState, useRef, useEffect } from 'react';
import { User, ChevronDown, FileText, RefreshCw, LogOut } from 'lucide-react';
import logo from '../assets/logo.svg';

interface Question {
  id: string;
  roundno: number;
  htmlcode: string;
  csscode: string;
}

interface NavbarProps {
  userName?: string;
  questions?: Question[];
  onRefresh?: () => void;
  onLogout?: () => void;
}

export function Navbar({ userName, questions = [], onRefresh, onLogout }: NavbarProps) {
  const [showQuestion, setShowQuestion] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const iframeRefs = useRef<{ [key: string]: HTMLIFrameElement | null }>({});

  // Filter questions where roundno <= 1000
  const visibleQuestions = questions.filter(q => {
    return q.roundno <= 1000;
  });

  useEffect(() => {
    if (selectedQuestion) {
      const iframe = iframeRefs.current[selectedQuestion.id];
      if (!iframe) return;

      const content = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { box-sizing: border-box; }
    html, body { 
      margin: 0; 
      padding: 0; 
      width: 100%;
      height: 100%;
      overflow: auto;
      font-family: system-ui, -apple-system, sans-serif;
    }
    body {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 16px;
    }
    ${selectedQuestion.csscode || ''}
  </style>
</head>
<body>
  ${selectedQuestion.htmlcode || '<p style="color: #999; text-align: center;">No question available yet</p>'}
</body>
</html>`;

      iframe.srcdoc = content;
    }
  }, [selectedQuestion]);

  const handleRefresh = async () => {
    if (onRefresh) {
      setIsRefreshing(true);
      await onRefresh();
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  return (
    <nav className="minecraft-panel bg-minecraft-wood wood-texture sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            
            <span className="text-xl font-minecraft font-bold text-white" style={{ textShadow: '3px 3px 0 rgba(0,0,0,0.7)' }}>Pixel Perfect</span>
          </div>

          <div className="flex items-center gap-4">
            {/* Question Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowQuestion(!showQuestion)}
                className="minecraft-btn flex items-center gap-2 px-4 py-2 bg-minecraft-stone hover:bg-minecraft-iron transition-colors text-white font-minecraft text-xs"
              >
                <FileText className="w-5 h-5" />
                <span className="font-semibold">Quests</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showQuestion ? 'rotate-180' : ''}`} />
              </button>

              {showQuestion && (
                <div className="absolute top-full right-0 mt-2 w-[650px] max-w-[90vw] z-50 animate-chest-open" style={{ maxHeight: 'calc(100vh - 100px)' }}>
                  {/* Chest Container with wooden texture */}
                  <div className="minecraft-panel bg-gradient-to-b from-amber-800 via-amber-700 to-amber-900 wood-texture shadow-2xl border-4 border-black flex flex-col" style={{ maxHeight: 'calc(100vh - 100px)' }}>
                    {/* Chest Header */}
                    <div className="flex items-center justify-between p-5 border-b-4 border-black bg-gradient-to-r from-amber-900 to-amber-800 animate-fade-in-up flex-shrink-0">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-yellow-600 rounded border-2 border-yellow-800 shadow-inner flex items-center justify-center">
                          <div className="w-4 h-1 bg-gray-800 rounded"></div>
                        </div>
                        <h3 className="text-lg font-minecraft font-bold text-yellow-200" style={{ textShadow: '3px 3px 0 rgba(0,0,0,0.9)' }}>
                          Quest Chest
                        </h3>
                      </div>
                      <button
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="minecraft-btn p-2 bg-minecraft-redstone hover:bg-red-700 transition-all disabled:opacity-50 shadow-lg"
                        title="Refresh questions"
                      >
                        <RefreshCw className={`w-5 h-5 text-white ${isRefreshing ? 'animate-spin' : ''}`} />
                      </button>
                    </div>
                    
                    {visibleQuestions.length > 0 ? (
                      <div className="overflow-y-auto overflow-x-hidden p-4 space-y-4 bg-gradient-to-b from-amber-950/40 to-amber-950/60 custom-scrollbar flex-1">
                        {visibleQuestions.map((question, index) => (
                          <div
                            key={question.id}
                            className="animate-fade-in-up"
                            style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'both' }}
                          >
                            {/* Question Chest Box */}
                            <div className="minecraft-panel bg-gradient-to-br from-yellow-900 via-amber-800 to-yellow-900 border-4 border-yellow-950 shadow-xl transition-all duration-300 hover:brightness-110">
                              <button
                                onClick={() => setSelectedQuestion(selectedQuestion?.id === question.id ? null : question)}
                                className="w-full text-left p-5 group transition-all hover:bg-yellow-700/30"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-4">
                                    {/* Round Badge */}
                                    <div className="minecraft-panel bg-gradient-to-br from-red-600 to-red-800 border-2 border-red-950 px-4 py-2 min-w-[80px] text-center shadow-lg">
                                      <span className="text-white font-minecraft font-bold text-sm" style={{ textShadow: '2px 2px 0 rgba(0,0,0,0.9)' }}>
                                        Round
                                      </span>
                                      <div className="text-yellow-300 font-minecraft font-bold text-xl mt-1" style={{ textShadow: '2px 2px 0 rgba(0,0,0,0.9)' }}>
                                        {question.roundno}
                                      </div>
                                    </div>
                                    
                                    {/* Question Title */}
                                    <div>
                                      <div className="text-yellow-100 font-minecraft font-bold text-base mb-1" style={{ textShadow: '2px 2px 0 rgba(0,0,0,0.8)' }}>
                                        Challenge #{question.roundno}
                                      </div>
                                      <div className="text-yellow-300/80 font-minecraft text-xs" style={{ textShadow: '1px 1px 0 rgba(0,0,0,0.8)' }}>
                                        Click to view quest details
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* Expand Icon */}
                                  <div className="minecraft-panel bg-amber-900 border-2 border-black p-2 group-hover:bg-amber-700 transition-colors">
                                    <ChevronDown 
                                      className={`w-5 h-5 text-yellow-200 transition-transform duration-300 ${selectedQuestion?.id === question.id ? 'rotate-180' : ''}`} 
                                    />
                                  </div>
                                </div>
                              </button>
                              
                              {/* Expanded Question Content */}
                              {selectedQuestion?.id === question.id && (
                                <div className="border-t-4 border-yellow-950 bg-gradient-to-b from-stone-800 to-stone-900 p-5">
                                  <div className="minecraft-panel bg-white border-4 border-stone-950 overflow-hidden shadow-2xl">
                                    <div className="bg-gradient-to-r from-stone-700 to-stone-600 px-4 py-2 border-b-4 border-stone-950">
                                      <span className="text-white font-minecraft text-sm font-bold" style={{ textShadow: '2px 2px 0 rgba(0,0,0,0.8)' }}>
                                        Preview
                                      </span>
                                    </div>
                                    <iframe
                                      ref={(el) => iframeRefs.current[question.id] = el}
                                      sandbox="allow-scripts"
                                      className="w-full h-96 bg-white border-0"
                                      style={{ display: 'block' }}
                                      title={`Round ${question.roundno} Preview`}
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 bg-gradient-to-b from-stone-800 to-stone-900">
                        <div className="minecraft-panel bg-gradient-to-br from-gray-800 to-gray-900 border-4 border-gray-950 p-6 text-center">
                          <div className="text-6xl mb-4">📦</div>
                          <p className="text-base font-minecraft text-yellow-300 font-bold mb-2" style={{ textShadow: '2px 2px 0 rgba(0,0,0,0.8)' }}>
                            Empty Chest
                          </p>
                          <p className="text-xs font-minecraft text-gray-400">
                            No quests available yet
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {userName && (
              <div className="flex items-center gap-3">
                <div className="minecraft-btn flex items-center gap-2 bg-minecraft-emerald px-4 py-2 text-white font-minecraft text-xs">
                  <User className="w-5 h-5" />
                  <span className="font-semibold" style={{ textShadow: '2px 2px 0 rgba(0,0,0,0.7)' }}>{userName}</span>
                </div>
                <button
                  onClick={onLogout}
                  className="minecraft-btn flex items-center gap-2 bg-minecraft-redstone hover:bg-red-700 px-4 py-2 text-white font-minecraft text-xs transition-all shadow-lg"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-semibold" style={{ textShadow: '2px 2px 0 rgba(0,0,0,0.7)' }}>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
