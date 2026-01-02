// ===== CONFIGURATION =====
const SUPABASE_URL = 'https://mxudgybuznzetkbalxcq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14dWRneWJ1em56ZXRrYmFseGNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwMzA5MzAsImV4cCI6MjA4MTYwNjkzMH0._XEGkpusuZHx5lQCxoilMMtdvToBU6hRLnELCT9yx4A';
const GROQ_API_KEY = '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';

// ===== STATE VARIABLES =====
let userData = { name: '', college: '' };
let questions = [];
let isSaving = false;
let isSubmitting = false;
let htmlMonacoEditor = null;
let cssMonacoEditor = null;

// ===== DOM ELEMENTS =====
const signInPage = document.getElementById('signInPage');
const mainApp = document.getElementById('mainApp');
const signInForm = document.getElementById('signInForm');
const navUserName = document.getElementById('navUserName');
const questionsBtn = document.getElementById('questionsBtn');
const questionsDropdown = document.getElementById('questionsDropdown');
const questionsList = document.getElementById('questionsList');
const refreshQuestionsBtn = document.getElementById('refreshQuestionsBtn');

const htmlEditorContainer = document.getElementById('htmlEditor');
const cssEditorContainer = document.getElementById('cssEditor');
const outputFrame = document.getElementById('outputFrame');
const fileInput = document.getElementById('fileInput');

const runBtn = document.getElementById('runBtn');
const saveBtn = document.getElementById('saveBtn');
const submitBtn = document.getElementById('submitBtn');

const saveMessage = document.getElementById('saveMessage');
const submitMessage = document.getElementById('submitMessage');
const notification = document.getElementById('notification');
const saveBtnText = document.getElementById('saveBtnText');
const submitBtnText = document.getElementById('submitBtnText');

// ===== MONACO EDITOR INITIALIZATION =====
function initMonacoEditors() {
    require.config({ paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs' } });
    require(['vs/editor/editor.main'], function () {
        // Initialize HTML Editor
        htmlMonacoEditor = monaco.editor.create(htmlEditorContainer, {
            value: '<!-- Type your HTML code here -->',
            language: 'html',
            theme: 'vs-light',
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: 'on'
        });

        // Initialize CSS Editor
        cssMonacoEditor = monaco.editor.create(cssEditorContainer, {
            value: '/* Type your CSS code here */',
            language: 'css',
            theme: 'vs-light',
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: 'on'
        });
    });
}

// ===== INITIALIZATION =====
function init() {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
        userData = JSON.parse(storedUser);
        showMainApp();
        initMonacoEditors();
        setTimeout(() => {
            loadSavedCode();
            fetchQuestions();
        }, 500);
    }

    // Event listeners
    signInForm.addEventListener('submit', handleSignIn);
    fileInput.addEventListener('change', handleFileUpload);
    runBtn.addEventListener('click', runCode);
    saveBtn.addEventListener('click', saveCode);
    submitBtn.addEventListener('click', submitCode);
    questionsBtn.addEventListener('click', toggleQuestionsDropdown);
    refreshQuestionsBtn.addEventListener('click', fetchQuestions);

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!questionsBtn.contains(e.target) && !questionsDropdown.contains(e.target)) {
            questionsDropdown.classList.remove('show');
        }
    });
}

// ===== SIGN IN =====
function handleSignIn(e) {
    e.preventDefault();
    const name = document.getElementById('userName').value.trim();
    const college = document.getElementById('userCollege').value.trim();
    
    if (name && college) {
        userData = { name, college };
        localStorage.setItem('user', JSON.stringify(userData));
        showMainApp();
        loadSavedCode();
        fetchQuestions();
    }
}

function showMainApp() {
    signInPage.classList.remove('active');
    mainApp.classList.add('active');
    navUserName.textContent = userData.name;
    initMonacoEditors();
    setTimeout(() => {
        loadSavedCode();
        fetchQuestions();
    }, 500);
}


// ===== QUESTIONS =====
function toggleQuestionsDropdown() {
    questionsDropdown.classList.toggle('show');
}

async function fetchQuestions() {
    refreshQuestionsBtn.classList.add('spin');
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/questions?select=*&order=roundno.asc`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });

        if (response.ok) {
            questions = await response.json();
            renderQuestions();
        }
    } catch (error) {
        console.error('Error fetching questions:', error);
    } finally {
        setTimeout(() => refreshQuestionsBtn.classList.remove('spin'), 500);
    }
}

function renderQuestions() {
    if (questions.length === 0) {
        questionsList.innerHTML = '<p class="no-questions">No questions available yet</p>';
        return;
    }

    questionsList.innerHTML = questions.map(q => `
        <div class="question-item">
            <button class="question-toggle" onclick="toggleQuestion('${q.id}')">
                <span>Round ${q.roundno}</span>
                <svg class="icon-chevron" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                </svg>
            </button>
            <div id="question-${q.id}" class="question-preview">
                <iframe id="frame-${q.id}" class="preview-frame" sandbox="allow-scripts allow-same-origin"></iframe>
            </div>
        </div>
    `).join('');

    // Render each question in its iframe
    questions.forEach(q => {
        const iframe = document.getElementById(`frame-${q.id}`);
        if (iframe) {
            const doc = iframe.contentDocument || iframe.contentWindow.document;
            const content = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        * { box-sizing: border-box; }
        html, body { 
            margin: 0; 
            padding: 16px; 
            font-family: system-ui, -apple-system, sans-serif;
        }
        ${q.csscode || ''}
    </style>
</head>
<body>
    ${q.htmlcode || '<p style="color: #999;">No question available</p>'}
</body>
</html>`;
            doc.open();
            doc.write(content);
            doc.close();
        }
    });
}

function toggleQuestion(id) {
    const preview = document.getElementById(`question-${id}`);
    preview.classList.toggle('show');
    const btn = preview.previousElementSibling;
    btn.classList.toggle('active');
}

// ===== CODE SAVING =====
async function loadSavedCode() {
    try {
        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/saved_code?user_name=eq.${encodeURIComponent(userData.name)}&select=*&order=updated_at.desc&limit=1`,
            {
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                }
            }
        );

        if (response.ok) {
            const data = await response.json();
            if (data && data.length > 0 && htmlMonacoEditor && cssMonacoEditor) {
                htmlMonacoEditor.setValue(data[0].html_code || '<!-- Type your HTML code here -->');
                cssMonacoEditor.setValue(data[0].css_code || '/* Type your CSS code here */');
            }
        }
    } catch (error) {
        console.log('No saved code found');
    }
}

async function saveCode() {
    if (isSaving) return;
    
    isSaving = true;
    saveBtn.disabled = true;
    saveBtnText.textContent = 'Saving...';
    saveMessage.textContent = '';

    try {
        // Check if user has existing saved code
        const checkResponse = await fetch(
            `${SUPABASE_URL}/rest/v1/saved_code?user_name=eq.${encodeURIComponent(userData.name)}&select=id`,
            {
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                }
            }
        );

        const existing = await checkResponse.json();
        const payload = {
            user_name: userData.name,
            html_code: htmlMonacoEditor.getValue(),
            css_code: cssMonacoEditor.getValue(),
            updated_at: new Date().toISOString()
        };

        let response;
        if (existing && existing.length > 0) {
            // Update existing
            response = await fetch(
                `${SUPABASE_URL}/rest/v1/saved_code?user_name=eq.${encodeURIComponent(userData.name)}`,
                {
                    method: 'PATCH',
                    headers: {
                        'apikey': SUPABASE_ANON_KEY,
                        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify(payload)
                }
            );
        } else {
            // Insert new
            response = await fetch(`${SUPABASE_URL}/rest/v1/saved_code`, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify(payload)
            });
        }

        if (response.ok) {
            saveMessage.textContent = '✅ Code saved successfully!';
            saveMessage.className = 'message success';
            setTimeout(() => saveMessage.textContent = '', 3000);
        } else {
            throw new Error('Failed to save code');
        }
    } catch (error) {
        saveMessage.textContent = `Error: ${error.message}`;
        saveMessage.className = 'message error';
    } finally {
        isSaving = false;
        saveBtn.disabled = false;
        saveBtnText.textContent = 'Save';
    }
}

// ===== FILE UPLOAD =====
function handleFileUpload(e) {
    const files = e.target.files;
    Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target.result;
            const fileName = file.name.toLowerCase();
            if (fileName.endsWith('.html') && htmlMonacoEditor) {
                htmlMonacoEditor.setValue(content);
            } else if (fileName.endsWith('.css') && cssMonacoEditor) {
                cssMonacoEditor.setValue(content);
            }
        };
        reader.readAsText(file);
    });
}

// ===== CODE EXECUTION =====
function runCode() {
    if (!htmlMonacoEditor || !cssMonacoEditor) return;
    const html = htmlMonacoEditor.getValue();
    const css = cssMonacoEditor.getValue();
    
    const content = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { margin: 0; padding: 16px; font-family: system-ui, -apple-system, sans-serif; }
    ${css}
  </style>
</head>
<body>
  ${html || '<p style="color: #999;">No HTML content</p>'}
</body>
</html>`;

    const doc = outputFrame.contentDocument || outputFrame.contentWindow.document;
    doc.open();
    doc.write(content);
    doc.close();

    setTimeout(() => {
        const scrollHeight = doc.body.scrollHeight;
        outputFrame.style.height = Math.max(400, scrollHeight + 40) + 'px';
    }, 100);
}

// ===== CODE SUBMISSION WITH AI SCORING =====
async function submitCode() {
    if (isSubmitting) return;
    
    isSubmitting = true;
    submitBtn.disabled = true;
    submitBtnText.textContent = 'Submitting...';
    submitMessage.textContent = '';

    try {
        if (!htmlMonacoEditor || !cssMonacoEditor) {
            throw new Error('Editor not initialized');
        }
        const html = htmlMonacoEditor.getValue();
        const css = cssMonacoEditor.getValue();
        const combinedCode = `HTML:\n${html}\n\nCSS:\n${css}`;

        // Get AI score
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json'
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
                max_tokens: 150
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'Failed to get AI score');
        }

        const data = await response.json();
        const aiResponse = data.choices[0].message.content;
        
        // Extract JSON
        const jsonMatch = aiResponse.match(/\{[\s\S]*?\}/);
        if (!jsonMatch) throw new Error('Invalid AI response format');
        
        const result = JSON.parse(jsonMatch[0]);
        const score = Math.round(result.score);
        const feedback = result.feedback || 'Creative code!';

        if (isNaN(score) || score < 0 || score > 100) {
            throw new Error('Invalid score from AI');
        }

        // Save to database
        const dbResponse = await fetch(`${SUPABASE_URL}/rest/v1/scores`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify({
                player_name: userData.name || 'Anonymous',
                score: score,
                description: feedback,
                html_code: html,
                css_code: css,
                metadata: {
                    html_length: html.length,
                    css_length: css.length,
                    scored_by: 'AI',
                    feedback: feedback,
                    userName: userData.name,
                    userCollege: userData.college,
                    timestamp: new Date().toISOString()
                }
            })
        });

        if (!dbResponse.ok) {
            const error = await dbResponse.json();
            throw new Error(`Database error: ${error.message}`);
        }

        submitMessage.textContent = '✅ Code submitted and scored successfully!';
        submitMessage.className = 'message success';
        showNotification();

        setTimeout(() => submitMessage.textContent = '', 5000);
    } catch (error) {
        submitMessage.textContent = `Error: ${error.message}`;
        submitMessage.className = 'message error';
    } finally {
        isSubmitting = false;
        submitBtn.disabled = false;
        submitBtnText.textContent = 'Submit';
    }
}

// ===== NOTIFICATION =====
function showNotification() {
    notification.classList.add('show');
    setTimeout(() => notification.classList.remove('show'), 5000);
}

// ===== START APP =====
init();
