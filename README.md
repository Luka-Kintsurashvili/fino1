# ფინო — შენი ფინანსური ასისტენტი

## Files
- `index.html` — main app
- `style.css` — all styles
- `app.js` — all logic + chatbot

## How to add your Gemini API Key

Open `app.js` and find this line:
```
const GEMINI_KEY = window.GEMINI_API_KEY || 'YOUR_GEMINI_API_KEY';
```
Replace `YOUR_GEMINI_API_KEY` with your actual key:
```
const GEMINI_KEY = window.GEMINI_API_KEY || 'AIzaSy_your_actual_key_here';
```

## Deploy to Vercel (free, 5 minutes)

1. Go to github.com → New repository → name it `fino`
2. Upload all 3 files (index.html, style.css, app.js)
3. Go to vercel.com → New Project → Import from GitHub
4. Select your `fino` repo → Deploy
5. Done! You get a free URL like fino.vercel.app

## To switch to Claude API later

In `app.js`, replace the `sendMsg` function's fetch call with:
```javascript
const response = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': 'YOUR_CLAUDE_KEY',
    'anthropic-version': '2023-06-01'
  },
  body: JSON.stringify({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    system: systemPrompt,
    messages: chatHistory.map(m => ({
      role: m.role === 'model' ? 'assistant' : 'user',
      content: m.parts[0].text
    }))
  })
});
const data = await response.json();
const reply = data.content?.[0]?.text || 'ბოდიში...';
```
