import { useState, useRef, useEffect } from 'react';
import { Upload, Play, Save, Send, Sparkles } from 'lucide-react';
import Editor from '@monaco-editor/react';
import { supabase } from '../lib/supabase';
//
interface CodeSandboxProps {
  userName?: string;
  userCollege?: string;
}
//
export function CodeSandbox({ userName, userCollege }: CodeSandboxProps) {
  const [html, setHtml] = useState('<!-- Type your HTML code here -->');
  const [css, setCss] = useState('/* Type your CSS code here */');
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [scoring, setScoring] = useState(false);
  const [scoreMessage, setScoreMessage] = useState('');
  const [showNotification, setShowNotification] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Load saved code on mount
  useEffect(() => {
    if (userName) {
      loadSavedCode();
    }
  }, [userName]);

  const loadSavedCode = async () => {
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
      console.log('No saved code found');
    }
  };

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
      console.error('Save error:', error);
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

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) return;

    const content = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { margin: 0; padding: 16px; font-family: system-ui, -apple-system, sans-serif; }
    ${css || ''}
  </style>
</head>
<body>
  ${html || '<p style="color: #999;">No HTML content</p>'}
</body>
</html>`;

    iframeDoc.open();
    iframeDoc.write(content);
    iframeDoc.close();

    setTimeout(() => {
      const body = iframeDoc.body;
      const scrollHeight = body.scrollHeight;
      if (iframe && scrollHeight > 0) {
        iframe.style.height = Math.max(400, scrollHeight + 40) + 'px';
      }
    }, 100);
  };

  const clearOutput = () => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) return;
    iframeDoc.open();
    iframeDoc.write('<!DOCTYPE html><html><body></body></html>');
    iframeDoc.close();
  };

  const submitCode = async () => {
    setSubmitting(true);
    setSubmitMessage('');

    try {
      const groqApiKey = import.meta.env.VITE_GROQ_API_KEY;
      
      if (!groqApiKey || groqApiKey === 'your_groq_api_key_here') {
        setSubmitMessage('Please configure GROQ API key in .env file');
        setSubmitting(false);
        return;
      }

      const combinedCode = `HTML:\n${html}\n\nCSS:\n${css}`;

      // Get AI score
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
              content: 'You are an expert web development judge. Evaluate HTML/CSS code based on: creativity (35%), design aesthetics (25%), code quality (10%), responsiveness potential (15%), and innovation (15%). Return ONLY a JSON object with format: {"score": <number 0-100>, "feedback": "<1-2 sentence brief evaluation>"}'
            },
            {
              role: 'user',
              content: `Evaluate this code and provide a creativity score out of 100:\n\n${combinedCode}`
            }
          ],
          temperature: 0.7,
          max_tokens: 150,
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
      
      const score = Math.round(result.score);
      const feedback = result.feedback || 'Creative code!';

      if (isNaN(score) || score < 0 || score > 100) {
        throw new Error('Invalid score from AI');
      }

      // Save to database with AI score
      const { data: insertedData, error: dbError } = await supabase
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
        })
        .select();

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
      console.error('Submission error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const scoreWithAI = async () => {
    setScoring(true);
    setScoreMessage('');

    try {
      const groqApiKey = import.meta.env.VITE_GROQ_API_KEY;
      
      if (!groqApiKey || groqApiKey === 'your_groq_api_key_here') {
        setScoreMessage('Please configure GROQ API key in .env file');
        setScoring(false);
        return;
      }

      const combinedCode = `HTML:\n${html}\n\nCSS:\n${css}`;

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
              content: 'You are an expert web development judge. Evaluate HTML/CSS code based on: creativity (35%), design aesthetics (25%), code quality (10%), responsiveness potential (15%), and innovation (15%). Return ONLY a JSON object with format: {"score": <number 0-100>, "feedback": "<1-2 sentence brief evaluation>"}'
            },
            {
              role: 'user',
              content: `Evaluate this code and provide a creativity score out of 100:\n\n${combinedCode}`
            }
          ],
          temperature: 0.7,
          max_tokens: 150,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to get AI score');
      }

      const data = await response.json();
      const aiResponse = data.choices[0].message.content;
      
      // More flexible JSON extraction
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
      
      const score = Math.round(result.score);
      const feedback = result.feedback || 'Creative code!';

      if (isNaN(score) || score < 0 || score > 100) {
        throw new Error('Invalid score from AI');
      }

      const { data: insertedData, error: dbError } = await supabase
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
        })
        .select();

      if (dbError) {
        throw new Error(`Database error: ${dbError.message}`);
      }

      setScoreMessage('✅ Submitted successfully!');
      setShowNotification(true);
      setTimeout(() => {
        setScoreMessage('');
        setShowNotification(false);
      }, 5000);
    } catch (error: any) {
      const errorMsg = error.message || 'Unknown error occurred';
      setScoreMessage(`Error: ${errorMsg}`);
      console.error('AI Scoring error:', error);
      setScoring(false);
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="p-4 minecraft-panel bg-minecraft-obsidian">
            <label className="block text-xs font-minecraft text-minecraft-diamond mb-2" style={{ textShadow: '2px 2px 0 rgba(0,0,0,0.8)' }}>HTML</label>
            <Editor
              height="350px"
              defaultLanguage="html"
              value={html}
              onChange={(value) => setHtml(value || '')}
              theme="vs-dark"
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
          <div className="p-4 minecraft-panel bg-minecraft-obsidian">
            <label className="block text-xs font-minecraft text-minecraft-emerald mb-2" style={{ textShadow: '2px 2px 0 rgba(0,0,0,0.8)' }}>CSS</label>
            <Editor
              height="350px"
              defaultLanguage="css"
              value={css}
              onChange={(value) => setCss(value || '')}
              theme="vs-dark"
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

        <div className="grid grid-cols-2 gap-4 mb-6">
          <button onClick={runCode} className="minecraft-btn bg-minecraft-grass grass-texture hover:brightness-110 text-white font-minecraft text-xs py-3 px-6 transition-all duration-200 flex items-center justify-center gap-2">
            <Play size={20} />
            <span style={{ textShadow: '2px 2px 0 rgba(0,0,0,0.7)' }}>Run</span>
          </button>
          <button 
            onClick={saveCode} 
            disabled={saving}
            className="minecraft-btn bg-minecraft-lapis hover:brightness-110 disabled:bg-gray-600 text-white font-minecraft text-xs py-3 px-6 transition-all duration-200 flex items-center justify-center gap-2"
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
          <iframe ref={iframeRef} sandbox="allow-scripts allow-same-origin" className="w-full min-h-96 minecraft-panel bg-white" title="Code Output" style={{ height: '400px' }} />
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
