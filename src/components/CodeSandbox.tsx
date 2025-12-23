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
  };{showNotification && (
          <div className="fixed top-4 right-4 z-50 animate-slide-in">
            <div className="bg-green-500 text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold">Score Submitted!</p>
                <p className="text-sm text-green-100">Your code has been evaluated and scored</p>
              </div>
            </div>
          </div>
        )}

        

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Code Sandbox</h2>
        
        <div className="mb-6 p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
          <div className="flex items-center gap-2 mb-3">
            <Upload className="w-5 h-5 text-gray-600" />
            <h3 className="text-sm font-semibold text-gray-700">Upload File</h3>
          </div>
          <div className="flex flex-col gap-2">
            <label className="block text-xs font-medium text-gray-600">Choose HTML or CSS files</label>
            <input
              type="file"
              accept=".html,.css"
              multiple
              onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
            />
            <p className="text-xs text-gray-500">Upload All Files Here!</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="p-4 bg-white border-2 border-gray-300 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-2">HTML</label>
            <Editor
              height="350px"
              defaultLanguage="html"
              value={html}
              onChange={(value) => setHtml(value || '')}
              theme="solarized"
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
          <div className="p-4 bg-white border-2 border-gray-300 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-2">CSS</label>
            <Editor
              height="350px"
              defaultLanguage="css"
              value={css}
              onChange={(value) => setCss(value || '')}
              theme="vs-light"
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
          <button onClick={runCode} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2">
            <Play size={20} />
            Run
          </button>
          <button 
            onClick={saveCode} 
            disabled={saving}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <Save size={20} />
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
        {saveMessage && (
          <p className={`mb-4 text-center text-sm font-medium ${saveMessage.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
            {saveMessage}
          </p>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Output</label>
          <iframe ref={iframeRef} sandbox="allow-scripts allow-same-origin" className="w-full min-h-96 border-2 border-gray-300 rounded-lg bg-white" title="Code Output" style={{ height: '400px' }} />
        </div>

        <div className="mt-6">
          <button
            onClick={submitCode}
            disabled={submitting}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
          >
            <Sparkles size={20} />
            {submitting ? 'Submitting...' : 'Submit'}
          </button>
          {submitMessage && (
            <p className={`mt-2 text-center text-sm font-medium ${submitMessage.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
              {submitMessage}
            </p>
          )}
        </div>
      </div>
  );
}
