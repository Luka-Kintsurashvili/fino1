export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { contents, systemInstruction } = req.body;
    
    // Vercel safely grabs your key from its environment dashboard configuration
    const GEMINI_KEY = process.env.GEMINI_API_KEY;

    if (!GEMINI_KEY) {
      return res.status(500).json({ error: 'Server configuration error: Key missing.' });
    }

    // Server-to-server request out to Google
    const googleResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: contents,
        systemInstruction: { parts: [{ text: systemInstruction }] }
      })
    });

    const data = await googleResponse.json();
    
    if (!googleResponse.ok) {
      return res.status(googleResponse.status).json({ error: data.error?.message || 'Gemini API Error' });
    }

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'ბოდიში, ვერ გავიგე.';
    return res.status(200).json({ reply });

  } catch (error) {
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}