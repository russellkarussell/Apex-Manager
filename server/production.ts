import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

let ai: GoogleGenAI | null = null;

if (process.env.AI_INTEGRATIONS_GEMINI_API_KEY) {
  ai = new GoogleGenAI({
    apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
    httpOptions: {
      apiVersion: "",
      baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
    },
  });
}

// API endpoints
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', aiAvailable: !!ai });
});

app.post('/api/generate-text', async (req, res) => {
  try {
    if (!ai) {
      return res.status(503).json({ error: 'AI service not available' });
    }

    const { prompt, model = 'gemini-2.5-flash', config } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      ...(config && { config })
    });

    res.json({ text: response.text || '' });
  } catch (error: any) {
    console.error('Error generating text:', error);
    res.status(500).json({ error: error.message || 'Failed to generate text' });
  }
});

app.post('/api/generate-image', async (req, res) => {
  try {
    if (!ai) {
      return res.status(503).json({ error: 'AI service not available' });
    }

    const { prompt, model = 'gemini-2.5-flash-image' } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const response = await ai.models.generateContent({
      model,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        const base64Image = `data:image/png;base64,${part.inlineData.data}`;
        return res.json({ image: base64Image });
      }
    }

    res.status(500).json({ error: 'No image data in response' });
  } catch (error: any) {
    console.error('Error generating image:', error);
    res.status(500).json({ error: error.message || 'Failed to generate image' });
  }
});

app.post('/api/generate-content', async (req, res) => {
  try {
    if (!ai) {
      return res.status(503).json({ error: 'AI service not available' });
    }

    const { model = 'gemini-2.5-flash', contents, config } = req.body;

    if (!contents) {
      return res.status(400).json({ error: 'Contents is required' });
    }

    const response = await ai.models.generateContent({
      model,
      contents,
      ...(config && { config })
    });

    const parts = response.candidates?.[0]?.content?.parts || [];
    
    const imagePart = parts.find((part: any) => part.inlineData);
    if (imagePart?.inlineData) {
      const mimeType = imagePart.inlineData.mimeType || 'image/png';
      return res.json({
        text: response.text || '',
        image: `data:${mimeType};base64,${imagePart.inlineData.data}`
      });
    }

    res.json({ text: response.text || '' });
  } catch (error: any) {
    console.error('Error generating content:', error);
    res.status(500).json({ error: error.message || 'Failed to generate content' });
  }
});

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, '..', 'dist')));

// Fallback to index.html for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Production server running on http://0.0.0.0:${PORT}`);
  console.log(`AI service ${ai ? 'available' : 'not available'}`);
});
