import { useState, useRef, useEffect } from 'react';
import { Code2, User, ChevronDown, FileText, RefreshCw } from 'lucide-react';

interface Question {
  id: string;
  roundno: string;
  htmlcode: string;
  csscode: string;
}

interface NavbarProps {
  userName?: string;
  questions?: Question[];
  onRefresh?: () => void;
}

export function Navbar({ userName, questions = [], onRefresh }: NavbarProps) {
  const [showQuestion, setShowQuestion] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (selectedQuestion && iframeRef.current) {
      const iframe = iframeRef.current;
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) return;

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

      iframeDoc.open();
      iframeDoc.write(content);
      iframeDoc.close();
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
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <Code2 className="w-8 h-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">Pixel Perfect</span>
          </div>

          <div className="flex items-center gap-4">
            {/* Question Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowQuestion(!showQuestion)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
              >
                <FileText className="w-5 h-5 text-purple-600" />
                <span className="font-semibold text-purple-700">Questions</span>
                <ChevronDown className={`w-4 h-4 text-purple-600 transition-transform ${showQuestion ? 'rotate-180' : ''}`} />
              </button>

              {showQuestion && (
                <div className="absolute top-full right-0 mt-2 w-[600px] max-w-[90vw] bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                  <div className="flex items-center justify-between p-4 border-b">
                    <h3 className="text-lg font-bold text-gray-900">Available Rounds</h3>
                    <button
                      onClick={handleRefresh}
                      disabled={isRefreshing}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                      title="Refresh questions"
                    >
                      <RefreshCw className={`w-5 h-5 text-purple-600 ${isRefreshing ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                  
                  {questions.length > 0 ? (
                    <div className="max-h-[500px] overflow-y-auto">
                      {questions.map((question) => (
                        <div
                          key={question.id}
                          className="border-b last:border-b-0"
                        >
                          <button
                            onClick={() => setSelectedQuestion(selectedQuestion?.id === question.id ? null : question)}
                            className="w-full text-left p-4 hover:bg-purple-50 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-purple-700">Round {question.roundno}</span>
                              <ChevronDown className={`w-4 h-4 text-purple-600 transition-transform ${selectedQuestion?.id === question.id ? 'rotate-180' : ''}`} />
                            </div>
                          </button>
                          
                          {selectedQuestion?.id === question.id && (
                            <div className="px-4 pb-4">
                              <div className="border-2 border-gray-300 rounded-lg overflow-hidden">
                                <iframe
                                  ref={iframeRef}
                                  sandbox="allow-scripts allow-same-origin"
                                  className="w-full h-96 bg-white border-0"
                                  style={{ display: 'block' }}
                                  title={`Round ${question.roundno} Preview`}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4">
                      <p className="text-sm text-gray-500 text-center">
                        No questions available yet
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {userName && (
              <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-lg">
                <User className="w-5 h-5 text-blue-600" />
                <span className="font-semibold text-gray-800">{userName}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
