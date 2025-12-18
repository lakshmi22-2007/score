import { useState, useRef } from 'react';
import { Upload, Play } from 'lucide-react';

export function CodeSandbox() {
  const [html, setHtml] = useState('<h1>Hello World!</h1>\n<p>This is a test paragraph.</p>\n<button onclick="alert(\'Button clicked!\')">Click Me</button>');
  const [css, setCss] = useState('');
  const [js, setJs] = useState('');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleFileUpload = (file: File, type: 'html' | 'css' | 'js') => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (type === 'html') setHtml(content);
      else if (type === 'css') setCss(content);
      else if (type === 'js') setJs(content);
    };
    reader.readAsText(file);
  };

  const runCode = () => {
    const iframe = iframeRef.current;
    if (!iframe) {
      console.log('No iframe ref');
      return;
    }

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) {
      console.log('No iframe document');
      return;
    }

    const content = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 16px; font-family: system-ui, -apple-system, sans-serif; }
    ${css || ''}
  </style>
</head>
<body>
  ${html || '<p style="color: #999;">No HTML content</p>'}
  <script>
    window.onerror = function(msg, url, line, col, error) {
      document.body.innerHTML += '<div style="background:#fee;border:1px solid #c00;color:#c00;padding:12px;margin-top:12px;border-radius:4px;font-family:monospace;font-size:12px;"><strong>Error:</strong> ' + msg + '<br>Line: ' + line + '</div>';
      return false;
    };
    
    try {
      ${js || ''}
    } catch (e) {
      document.body.innerHTML += '<div style="background:#fee;border:1px solid #c00;color:#c00;padding:12px;margin-top:12px;border-radius:4px;font-family:monospace;font-size:12px;"><strong>Error:</strong> ' + e.message + '</div>';
    }
  <\/script>
</body>
</html>`;

    iframeDoc.open();
    iframeDoc.write(content);
    iframeDoc.close();
    console.log('Code executed');
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Code Sandbox</h2>
        
        <div className="mb-6 p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
          <div className="flex items-center gap-2 mb-3">
            <Upload className="w-5 h-5 text-gray-600" />
            <h3 className="text-sm font-semibold text-gray-700">Upload Files</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">HTML File</label>
              <input
                type="file"
                accept=".html"
                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'html')}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">CSS File</label>
              <input
                type="file"
                accept=".css"
                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'css')}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">JS File</label>
              <input
                type="file"
                accept=".js"
                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'js')}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
              />
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">HTML</label>
            <textarea
              value={html}
              onChange={(e) => setHtml(e.target.value)}
              className="w-full h-48 px-4 py-3 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="<h1>Hello World</h1>"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">CSS</label>
            <textarea
              value={css}
              onChange={(e) => setCss(e.target.value)}
              className="w-full h-48 px-4 py-3 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="h1 { color: blue; }"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">JavaScript</label>
            <textarea
              value={js}
              onChange={(e) => setJs(e.target.value)}
              className="w-full h-48 px-4 py-3 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="console.log('Hello');"
            />
          </div>
        </div>

        <button
          onClick={runCode}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 mb-6"
        >
          <Play size={20} />
          Generate Output
        </button>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Output</label>
          <iframe
            ref={iframeRef}
            sandbox="allow-scripts allow-same-origin"
            className="w-full h-80 border border-gray-300 rounded-lg bg-white"
            title="Code Output"
          />
        </div>
      </div>
    </div>
  );
}
