import { useState, useRef } from 'react';
import { Upload, Play, X } from 'lucide-react';
import Editor from '@monaco-editor/react';

export function CodeSandbox() {
  const [html, setHtml] = useState('<h1>Hello World!</h1>\n<p>This is a test paragraph.</p>\n<button onclick="alert(\'Button clicked!\')">Click Me</button>');
  const [css, setCss] = useState('');
  const iframeRef = useRef<HTMLIFrameElement>(null);

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

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">HTML</label>
            <Editor
              height="500px"
              defaultLanguage="html"
              value={html}
              onChange={(value) => setHtml(value || '')}
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">CSS</label>
            <Editor
              height="500px"
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
            Generate Output
          </button>
          <button onClick={clearOutput} className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2">
            <X size={20} />
            Clear Output
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Output</label>
          <iframe ref={iframeRef} sandbox="allow-scripts allow-same-origin" className="w-full h-80 border border-gray-300 rounded-lg bg-white" title="Code Output" />
        </div>
      </div>
    </div>
  );
}
