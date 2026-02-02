import { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, Play, Save, Sparkles, Palette, Maximize, Minimize } from 'lucide-react';
import Editor from '@monaco-editor/react';
import { supabase } from '../lib/supabase';
//
interface CodeSandboxProps {
  userName?: string;
  userCollege?: string;
  question?: {
    id: string;
    roundno: number;
    htmlcode: string;
    csscode: string;
  };
}
//
export function CodeSandbox({ userName, userCollege, question }: CodeSandboxProps) {
  const [html, setHtml] = useState('<!-- Type your HTML code here -->');
  const [css, setCss] = useState('/* Type your CSS code here */');
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [showNotification, setShowNotification] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [editorTheme, setEditorTheme] = useState<'vs-dark' | 'light'>('vs-dark');
  const [expandedEditor, setExpandedEditor] = useState<'html' | 'css' | null>(null);
  const [showExpandDialog, setShowExpandDialog] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const expandedIframeRef = useRef<HTMLIFrameElement>(null);


  const loadSavedCode = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('saved_code')
        .select('html_code, css_code')
        .eq('user_name', userName)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      if (data && !error) {
        setHtml(data.html_code || '<!-- Type your HTML code here -->');
        setCss(data.css_code || '/* Type your CSS code here */');
      }
    } catch (error) {
      // No saved code found, continue with defaults
    }
  }, [userName]);

  // Load saved code on mount
  useEffect(() => {
    if (userName) {
      loadSavedCode();
    }
  }, [userName, loadSavedCode]);

  const saveCode = async () => {
    setSaving(true);
    setSaveMessage('');

    try {
      if (!userName) {
        setSaveMessage('Please sign in to save code');
        setSaving(false);
        return;
      }

      // Check if user already has saved code
      const { data: existing } = await supabase
        .from('saved_code')
        .select('id')
        .eq('user_name', userName)
        .single();

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from('saved_code')
          .update({
            html_code: html,
            css_code: css,
            updated_at: new Date().toISOString(),
          })
          .eq('user_name', userName);

        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from('saved_code')
          .insert({
            user_name: userName,
            html_code: html,
            css_code: css,
          });

        if (error) throw error;
      }

      setSaveMessage('✅ Code saved successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error: any) {
      setSaveMessage(`Error: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = (files: FileList) => {
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        const fileName = file.name.toLowerCase();

        if (fileName.endsWith('.html')) {
          setHtml(content);
        } else if (fileName.endsWith('.css')) {
          setCss(content);
        }
      };
      reader.readAsText(file);
    });
  };

  const runCode = () => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const content = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { margin: 0; padding: 16px; font-family: system-ui, -apple-system, sans-serif; }
    ${css ? css : '/* No CSS styles */'}
  </style>
</head>
<body>
  ${html || '<p style="color: #999;">No HTML content</p>'}
</body>
</html>`;

    iframe.srcdoc = content;
  };

  const runExpandedCode = () => {
    const iframe = expandedIframeRef.current;
    if (!iframe) return;

    const content = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { margin: 0; padding: 16px; font-family: system-ui, -apple-system, sans-serif; }
    ${css ? css : '/* No CSS styles */'}
  </style>
</head>
<body>
  ${html || '<p style="color: #999;">No HTML content</p>'}
</body>
</html>`;

    iframe.srcdoc = content;
  };

  const handleExpand = (editor: 'html' | 'css') => {
    setExpandedEditor(editor);
    setShowExpandDialog(true);
    setTimeout(() => runExpandedCode(), 100);
  };

  const handleCloseDialog = () => {
    setShowExpandDialog(false);
    setExpandedEditor(null);
  };

  const submitCode = async () => {
    setSubmitting(true);
    setSubmitMessage('');

    // Auto-save code before submitting
    if (userName) {
      await saveCode();
    }

    try {
      // Load Balancer: Rotate between 3 API keys
      const apiKeys = [
        import.meta.env.VITE_GROQ_API_KEY_1,
        import.meta.env.VITE_GROQ_API_KEY_2,
        import.meta.env.VITE_GROQ_API_KEY_3,
      ].filter(Boolean); // Remove undefined keys

      if (apiKeys.length === 0) {
        setSubmitMessage('Please configure GROQ API keys in .env file');
        setSubmitting(false);
        return;
      }

      // Round-robin: Use current timestamp to select key
      const keyIndex = Math.floor(Date.now() / 1000) % apiKeys.length;
      const groqApiKey = apiKeys[keyIndex];

      console.log(`Using API key ${keyIndex + 1} of ${apiKeys.length}`);

      if (!question || !question.htmlcode) {
        setSubmitMessage('Question data not available - roundno 2001 not found or missing htmlcode');
        setSubmitting(false);
        return;
      }

      const expectedCode = `HTML:\n${question.htmlcode}\n\nCSS:\n${question.csscode || '/* No CSS required */'}`;
      const userCode = `HTML:\n${html}\n\nCSS:\n${css}`;

      console.log('=== EXPECTED CODE (from question 2001) ===');
      console.log(expectedCode);
      console.log('=== USER SUBMITTED CODE ===');
      console.log(userCode);

      const systemPrompt = 'You are an expert web development judge. Compare the user\'s HTML/CSS code with the expected solution and provide a precise, natural integer score from 0-100. DO NOT round to multiples of 10 or 20. Use natural scores like 87, 63, 54, 91, etc. Evaluate: 1) HTML tag correctness and hierarchy (40%): exact tags, nesting, semantic structure. 2) CSS selector accuracy and property values (35%): correct selectors, property names, values. 3) Visual output similarity (20%): rendering matches expected. 4) Code approach (5%): efficient implementation. Allow minor differences if visually equivalent. Return ONLY strict JSON: {"score": <integer 0-100>, "feedback": "<1-2 sentences explaining match quality or differences>"}';

      const userPrompt = `Compare these codes precisely and provide a natural integer score (not rounded to multiples).\n\nEXPECTED CODE:\n${expectedCode}\n\nUSER SUBMITTED CODE:\n${userCode}`;

      console.log('=== API SYSTEM PROMPT ===');
      console.log(systemPrompt);
      console.log('=== API USER PROMPT ===');
      console.log(userPrompt);

      // Get AI similarity score
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: userPrompt
            }
          ],
          temperature: 0.3,
          max_tokens: 200,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to get AI score');
      }

      const data = await response.json();
      const aiResponse = data.choices[0].message.content;

      // Extract JSON
      let result;
      try {
        const jsonMatch = aiResponse.match(/\{[\s\S]*?\}/);
        if (!jsonMatch) {
          throw new Error('Invalid AI response format');
        }
        result = JSON.parse(jsonMatch[0]);
      } catch (parseError) {
        throw new Error('Could not parse AI response');
      }

      const score = Math.floor(result.score);
      const feedback = result.feedback || 'Creative code!';

      if (isNaN(score) || score < 0 || score > 100) {
        throw new Error('Invalid score from AI');
      }

      // Insert new score (allows multiple submissions per user)
      const { error: dbError } = await supabase
        .from('scores')
        .insert({
          player_name: userName || 'Anonymous',
          score: score,
          description: feedback,
          html_code: html,
          css_code: css,
          metadata: {
            html_length: html.length,
            css_length: css.length,
            scored_by: 'AI',
            feedback: feedback,
            userName: userName,
            userCollege: userCollege,
            timestamp: new Date().toISOString(),
          },
        });

      if (dbError) {
        throw new Error(`Database error: ${dbError.message}`);
      }

      setSubmitMessage('✅ Code submitted and scored successfully!');
      setShowNotification(true);
      setTimeout(() => {
        setSubmitMessage('');
        setShowNotification(false);
      }, 5000);
    } catch (error: any) {
      const errorMsg = error.message || 'Unknown error occurred';
      setSubmitMessage(`Error: ${errorMsg}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {showNotification && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div className="minecraft-panel bg-minecraft-emerald grass-texture text-white px-6 py-4 shadow-2xl flex items-center gap-3">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="font-minecraft text-xs" style={{ textShadow: '2px 2px 0 rgba(0,0,0,0.7)' }}>Score Submitted!</p>
              <p className="text-xs" style={{ textShadow: '2px 2px 0 rgba(0,0,0,0.5)' }}>Your code has been evaluated</p>
            </div>
          </div>
        </div>
      )}

      <div className="minecraft-panel bg-minecraft-stone stone-texture p-6 mb-8">
        <h2 className="text-xl font-minecraft font-bold text-white mb-6" style={{ textShadow: '3px 3px 0 rgba(0,0,0,0.7)' }}>Crafting Bench</h2>

        <div className="mb-6 p-4 minecraft-panel bg-minecraft-dirt wood-texture">
          <div className="flex items-center gap-2 mb-3">
            <Upload className="w-5 h-5 text-white" />
            <h3 className="text-xs font-minecraft font-semibold text-white" style={{ textShadow: '2px 2px 0 rgba(0,0,0,0.7)' }}>Upload Files</h3>
          </div>
          <div className="flex flex-col gap-2">
            <label className="block text-xs font-minecraft text-minecraft-gold" style={{ textShadow: '2px 2px 0 rgba(0,0,0,0.7)' }}>Choose HTML or CSS</label>
            <input
              type="file"
              accept=".html,.css"
              multiple
              onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
              className="block w-full text-xs font-minecraft text-white file:mr-4 file:py-2 file:px-4 file:minecraft-btn file:border-0 file:text-xs file:font-minecraft file:bg-minecraft-wood file:text-white hover:file:brightness-110 cursor-pointer"
            />
            <p className="text-xs font-minecraft text-minecraft-gold" style={{ textShadow: '2px 2px 0 rgba(0,0,0,0.7)' }}>Upload All Files!</p>
          </div>
        </div>

        <div className="mb-4 flex justify-end">
          <button
            onClick={() => setEditorTheme(prev => prev === 'vs-dark' ? 'light' : 'vs-dark')}
            className="minecraft-btn bg-minecraft-lapis hover:brightness-110 text-white font-minecraft text-xs py-2 px-4 transition-all duration-200 flex items-center gap-2"
          >
            <Palette size={16} />
            <span style={{ textShadow: '2px 2px 0 rgba(0,0,0,0.7)' }}>
              {editorTheme === 'vs-dark' ? 'Dark' : 'Light'}
            </span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="p-4 minecraft-panel" style={{ backgroundColor: editorTheme === 'vs-dark' ? '#1e1e1e' : '#ffffff' }}>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-minecraft" style={{ color: editorTheme === 'vs-dark' ? '#5db9ff' : '#1e1e1e', textShadow: editorTheme === 'vs-dark' ? '2px 2px 0 rgba(0,0,0,0.8)' : 'none' }}>HTML</label>
              <button
                onClick={() => handleExpand('html')}
                className="minecraft-btn bg-minecraft-emerald hover:brightness-110 text-white font-minecraft text-xs py-1 px-2 transition-all duration-200 flex items-center justify-center"
                title="Expand HTML Editor"
              >
                <Maximize size={18} />
              </button>
            </div>
            <Editor
              height="350px"
              defaultLanguage="html"
              value={html}
              onChange={(value) => setHtml(value || '')}
              theme={editorTheme}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                roundedSelection: false,
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
                wordWrap: 'on'
              }}
            />
          </div>
          <div className="p-4 minecraft-panel" style={{ backgroundColor: editorTheme === 'vs-dark' ? '#1e1e1e' : '#ffffff' }}>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-minecraft" style={{ color: editorTheme === 'vs-dark' ? '#50fa7b' : '#1e1e1e', textShadow: editorTheme === 'vs-dark' ? '2px 2px 0 rgba(0,0,0,0.8)' : 'none' }}>CSS</label>
              <button
                onClick={() => handleExpand('css')}
                className="minecraft-btn bg-minecraft-emerald hover:brightness-110 text-white font-minecraft text-xs py-1 px-2 transition-all duration-200 flex items-center justify-center"
                title="Expand CSS Editor"
              >
                <Maximize size={18} />
              </button>
            </div>
            <Editor
              height="350px"
              defaultLanguage="css"
              value={css}
              onChange={(value) => setCss(value || '')}
              theme={editorTheme}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                roundedSelection: false,
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
                wordWrap: 'on'
              }}
            />
          </div>
        </div>

        {/* Expanded Editor Modal Dialog */}
        {showExpandDialog && expandedEditor && (
          <div
            className="fixed inset-0 flex items-center justify-center p-4"
            style={{
              zIndex: 9999,
              backgroundColor: 'rgba(0, 0, 0, 0.85)',
              backdropFilter: 'blur(4px)'
            }}
            onClick={handleCloseDialog}
          >
            <div
              className="minecraft-panel bg-minecraft-stone stone-texture w-full max-w-7xl p-6 relative overflow-hidden"
              style={{
                maxHeight: '90vh',
                boxShadow: '0 0 40px rgba(0,0,0,0.8)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-minecraft text-white" style={{ textShadow: '2px 2px 0 rgba(0,0,0,0.7)' }}>
                  {expandedEditor === 'html' ? 'HTML Editor' : 'CSS Editor'} - Expanded View
                </h3>
                <button
                  onClick={handleCloseDialog}
                  className="minecraft-btn bg-minecraft-redstone hover:brightness-110 text-white font-minecraft text-xs p-2 transition-all duration-200"
                >
                  <Minimize size={16} />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4" style={{ height: 'calc(90vh - 100px)' }}>
                <div className="p-4 minecraft-panel overflow-hidden flex flex-col" style={{ backgroundColor: editorTheme === 'vs-dark' ? '#1e1e1e' : '#ffffff', height: '100%' }}>
                  <label className="block text-xs font-minecraft mb-2" style={{ color: editorTheme === 'vs-dark' ? (expandedEditor === 'html' ? '#5db9ff' : '#50fa7b') : '#1e1e1e', textShadow: editorTheme === 'vs-dark' ? '2px 2px 0 rgba(0,0,0,0.8)' : 'none' }}>
                    {expandedEditor === 'html' ? 'HTML' : 'CSS'}
                  </label>
                  <div style={{ flex: 1, minHeight: 0 }}>
                    <Editor
                      height="100%"
                      defaultLanguage={expandedEditor}
                      value={expandedEditor === 'html' ? html : css}
                      onChange={(value) => {
                        if (expandedEditor === 'html') {
                          setHtml(value || '');
                        } else {
                          setCss(value || '');
                        }
                        setTimeout(() => runExpandedCode(), 100);
                      }}
                      theme={editorTheme}
                      options={{
                        minimap: { enabled: true },
                        fontSize: 14,
                        lineNumbers: 'on',
                        roundedSelection: false,
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        tabSize: 2,
                        wordWrap: 'on'
                      }}
                    />
                  </div>
                </div>

                <div className="p-4 minecraft-panel flex flex-col h-full" style={{ backgroundColor: '#f5f5f5' }}>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-minecraft text-minecraft-stone" style={{ textShadow: '1px 1px 0 rgba(255,255,255,0.5)' }}>
                      Live Preview
                    </label>
                    <button
                      onClick={runExpandedCode}
                      className="minecraft-btn bg-minecraft-lapis hover:brightness-110 text-white font-minecraft text-xs py-1 px-3 transition-all duration-200 flex items-center gap-2"
                    >
                      <Play size={16} />
                      <span style={{ textShadow: '2px 2px 0 rgba(0,0,0,0.7)' }}>Run</span>
                    </button>
                  </div>
                  <iframe
                    ref={expandedIframeRef}
                    sandbox="allow-scripts"
                    className="w-full minecraft-panel bg-white"
                    style={{ flex: 1, minHeight: 0 }}
                    title="Expanded Code Output"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 mb-6">
          <button onClick={runCode} className="minecraft-btn bg-minecraft-grass grass-texture hover:brightness-110 text-white font-minecraft text-xs py-3 px-6 transition-all duration-200 flex items-center justify-center gap-2">
            <Play size={20} />
            <span style={{ textShadow: '2px 2px 0 rgba(0,0,0,0.7)' }}>Run</span>
          </button>
          <button
            onClick={saveCode}
            disabled={saving}
            className="minecraft-btn bg-minecraft-diamond hover:brightness-110 disabled:opacity-50 text-white font-minecraft text-xs py-3 px-6 transition-all duration-200 flex items-center justify-center gap-2"
          >
            <Save size={20} />
            <span style={{ textShadow: '2px 2px 0 rgba(0,0,0,0.7)' }}>{saving ? 'Saving...' : 'Save'}</span>
          </button>
        </div>
        {saveMessage && (
          <p className={`mb-4 text-center text-xs font-minecraft ${saveMessage.includes('success') ? 'text-minecraft-emerald' : 'text-minecraft-redstone'}`} style={{ textShadow: '2px 2px 0 rgba(0,0,0,0.7)' }}>
            {saveMessage}
          </p>
        )}

        <div>
          <label className="block text-xs font-minecraft text-white mb-2" style={{ textShadow: '2px 2px 0 rgba(0,0,0,0.7)' }}>Output</label>
          <iframe ref={iframeRef} sandbox="allow-scripts" className="w-full min-h-96 minecraft-panel bg-white" title="Code Output" style={{ height: '400px' }} />
        </div>

        <div className="mt-6">
          <button
            onClick={submitCode}
            disabled={submitting}
            className="minecraft-btn w-full bg-minecraft-gold hover:brightness-110 disabled:bg-gray-600 text-minecraft-obsidian font-minecraft text-xs py-3 px-6 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 animate-glow"
          >
            <Sparkles size={20} />
            <span style={{ textShadow: '2px 2px 0 rgba(255,255,255,0.5)' }}>{submitting ? 'Submitting...' : 'Submit'}</span>
          </button>
          {submitMessage && (
            <p className={`mt-2 text-center text-xs font-minecraft ${submitMessage.includes('success') ? 'text-minecraft-emerald' : 'text-minecraft-redstone'}`} style={{ textShadow: '2px 2px 0 rgba(0,0,0,0.7)' }}>
              {submitMessage}
            </p>
          )}
        </div>
      </div>
    </>
  );
}
