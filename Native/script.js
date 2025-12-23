// ===== STATE VARIABLES =====
let userData = {
    name: '',
    college: ''
};

let isSubmitting = false;
let isScoring = false;

// Configuration

// ===== DOM ELEMENTS =====
const signInPage = document.getElementById('signInPage');
const mainApp = document.getElementById('mainApp');
const signInForm = document.getElementById('signInForm');
const navUserName = document.getElementById('navUserName');

const htmlEditor = document.getElementById('htmlEditor');
const cssEditor = document.getElementById('cssEditor');
const outputFrame = document.getElementById('outputFrame');
const fileInput = document.getElementById('fileInput');

const runBtn = document.getElementById('runBtn');
const clearBtn = document.getElementById('clearBtn');
const submitBtn = document.getElementById('submitBtn');
const scoreBtn = document.getElementById('scoreBtn');

const submitMessage = document.getElementById('submitMessage');
const scoreMessage = document.getElementById('scoreMessage');
const notification = document.getElementById('notification');

const submitBtnText = document.getElementById('submitBtnText');
const scoreBtnText = document.getElementById('scoreBtnText');

// ===== INITIALIZATION =====
function init() {
    // Check if user is already signed in
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
        userData = JSON.parse(storedUser);
        showMainApp();
    }

    // Add event listeners
    signInForm.addEventListener('submit', handleSignIn);
    fileInput.addEventListener('change', handleFileUpload);
    runBtn.addEventListener('click', runCode);
    clearBtn.addEventListener('click', clearOutput);
    submitBtn.addEventListener('click', submitCode);
    scoreBtn.addEventListener('click', scoreWithAI);
}

// ===== SIGN IN HANDLING =====
function handleSignIn(e) {
    e.preventDefault();
    
    const name = document.getElementById('userName').value.trim();
    const college = document.getElementById('userCollege').value.trim();
    
    if (name && college) {
        userData = { name, college };
        localStorage.setItem('user', JSON.stringify(userData));
        showMainApp();
    }
}

function showMainApp() {
    signInPage.classList.remove('active');
    mainApp.classList.add('active');
    navUserName.textContent = userData.name;
}

// ===== FILE UPLOAD HANDLING =====
function handleFileUpload(e) {
    const files = e.target.files;
    
    Array.from(files).forEach(file => {
        const reader = new FileReader();
        
        reader.onload = (event) => {
            const content = event.target.result;
            const fileName = file.name.toLowerCase();
            
            if (fileName.endsWith('.html')) {
                htmlEditor.value = content;
            } else if (fileName.endsWith('.css')) {
                cssEditor.value = content;
            }
        };
        
        reader.readAsText(file);
    });
}

// ===== CODE EXECUTION =====
function runCode() {
    const html = htmlEditor.value;
    const css = cssEditor.value;
    
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

    const iframe = outputFrame;
    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    
    iframeDoc.open();
    iframeDoc.write(content);
    iframeDoc.close();
    
    // Auto-resize iframe
    setTimeout(() => {
        const body = iframeDoc.body;
        if (body) {
            const scrollHeight = body.scrollHeight;
            iframe.style.height = Math.max(400, scrollHeight + 40) + 'px';
        }
    }, 100);
}

function clearOutput() {
    const iframe = outputFrame;
    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    
    iframeDoc.open();
    iframeDoc.write('<!DOCTYPE html><html><body></body></html>');
    iframeDoc.close();
    
    iframe.style.height = '400px';
}

// ===== CODE SUBMISSION (Placeholder) =====
async function submitCode() {
    if (isSubmitting) return;
    
    isSubmitting = true;
    submitBtn.disabled = true;
    submitBtnText.textContent = 'Submitting...';
    submitMessage.textContent = '';
    submitMessage.className = 'message';
    
    try {
        const html = htmlEditor.value;
        const css = cssEditor.value;
        
        const combinedCode = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { margin: 0; padding: 16px; font-family: system-ui, -apple-system, sans-serif; }
    ${css}
  </style>
</head>
<body>
  ${html}
</body>
</html>`;

        // Placeholder - Replace with actual server endpoint
        const serverEndpoint = 'YOUR_SERVER_ENDPOINT_HERE';
        
        const response = await fetch(serverEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                code: combinedCode,
                html: html,
                css: css,
                timestamp: new Date().toISOString(),
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to submit code');
        }

        submitMessage.textContent = 'Code submitted successfully!';
        submitMessage.className = 'message success';
        
        setTimeout(() => {
            submitMessage.textContent = '';
        }, 3000);
        
    } catch (error) {
        submitMessage.textContent = 'Error submitting code. Please try again.';
        submitMessage.className = 'message error';
    } finally {
        isSubmitting = false;
        submitBtn.disabled = false;
        submitBtnText.textContent = 'Submit Code';
    }
}

// ===== AI SCORING =====
async function scoreWithAI() {
    if (isScoring) return;
    
    isScoring = true;
    scoreBtn.disabled = true;
    scoreBtnText.textContent = 'Scoring...';
    scoreMessage.textContent = '';
    scoreMessage.className = 'message';
    
    try {
        const html = htmlEditor.value;
        const css = cssEditor.value;
        const combinedCode = `HTML:\n${html}\n\nCSS:\n${css}`;
        
        // Call Groq API
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert web development judge. Evaluate HTML/CSS code based on: creativity (30%), design aesthetics (25%), code quality (20%), responsiveness potential (15%), and innovation (10%). Return ONLY a JSON object with format: {"score": <number 0-100>, "feedback": "<brief evaluation>"}'
                    },
                    {
                        role: 'user',
                        content: `Evaluate this code and provide a creativity score out of 100:\n\n${combinedCode}`
                    }
                ],
                temperature: 0.7,
                max_tokens: 500,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'Failed to get AI score');
        }

        const data = await response.json();
        const aiResponse = data.choices[0].message.content;
        
        // Extract JSON from response
        const jsonMatch = aiResponse.match(/\{[\s\S]*?\}/);
        if (!jsonMatch) {
            throw new Error('Invalid AI response format');
        }
        
        const result = JSON.parse(jsonMatch[0]);
        const score = Math.round(result.score);
        const feedback = result.feedback || 'Creative code!';
        
        if (isNaN(score) || score < 0 || score > 100) {
            throw new Error('Invalid score from AI');
        }
        
        // Save to Supabase
        await saveScoreToDatabase(score, feedback);
        
        // Show success notification
        showNotification();
        
        scoreMessage.textContent = '✅ Submitted successfully!';
        scoreMessage.className = 'message success';
        
        setTimeout(() => {
            scoreMessage.textContent = '';
        }, 5000);
        
    } catch (error) {
        scoreMessage.textContent = `Error: ${error.message}`;
        scoreMessage.className = 'message error';
    } finally {
        isScoring = false;
        scoreBtn.disabled = false;
        scoreBtnText.textContent = 'Score';
    }
}

// ===== DATABASE INTERACTION =====
async function saveScoreToDatabase(score, feedback) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/scores`, {
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
            metadata: {
                html_length: htmlEditor.value.length,
                css_length: cssEditor.value.length,
                scored_by: 'AI',
                feedback: feedback,
                userName: userData.name,
                userCollege: userData.college,
                timestamp: new Date().toISOString(),
            },
        }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(`Database error: ${error.message}`);
    }
}

// ===== NOTIFICATION =====
function showNotification() {
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 5000);
}

// ===== START APP =====
init();
