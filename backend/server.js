import express  from 'express'
import cors     from 'cors'
import dotenv   from 'dotenv'

dotenv.config()

const app  = express()
const PORT = process.env.PORT || 3001

// ── Middleware ───────────────────────────────────────────────
app.use(express.json())
app.use(cors({
  origin: [
    'http://localhost:5173',   // local dev
    'http://localhost:4173',   // local preview
    /\.vercel\.app$/,          // any vercel deployment
    /\.netlify\.app$/,         // any netlify deployment
  ],
  methods: ['GET', 'POST'],
}))

// ── Gemini models to try in order ────────────────────────────
const GEMINI_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash-latest',
]

// ── Call Gemini with auto-retry ───────────────────────────────
// ── Gemini with smarter retry + exponential backoff ──────────
async function callGemini(systemPrompt, contents, modelIndex = 0, attempt = 0) {
  if (modelIndex >= GEMINI_MODELS.length)
    throw new Error('Gemini is busy right now. Please wait 30 seconds and try again.')

  const model    = GEMINI_MODELS[modelIndex]
  const apiKey   = process.env.GEMINI_API_KEY

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents,
          generationConfig: { maxOutputTokens: 1024, temperature: 0.9 },
        }),
      }
    )

    if (!response.ok) {
      const err  = await response.json().catch(() => ({}))
      const msg  = err.error?.message || ''
      const busy =
        msg.includes('high demand') || msg.includes('overloaded') ||
        msg.includes('quota')       || msg.includes('RESOURCE_EXHAUSTED') ||
        response.status === 503     || response.status === 429    ||
        response.status === 404     || msg.includes('not found')

      if (busy) {
        // Try same model again once with longer wait
        if (attempt < 2) {
          const waitMs = (attempt + 1) * 5000  // 5s, 10s
          console.log(`Model ${model} busy — retrying in ${waitMs/1000}s (attempt ${attempt + 1})`)
          await new Promise(r => setTimeout(r, waitMs))
          return callGemini(systemPrompt, contents, modelIndex, attempt + 1)
        }
        // Then move to next model
        console.log(`Switching from ${model} to next model...`)
        await new Promise(r => setTimeout(r, 3000))
        return callGemini(systemPrompt, contents, modelIndex + 1, 0)
      }
      throw new Error(msg || `Gemini error ${response.status}`)
    }

    const data = await response.json()
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '...'

  } catch (err) {
    // Network error — retry once
    if (attempt < 1 && err.message.includes('fetch')) {
      await new Promise(r => setTimeout(r, 2000))
      return callGemini(systemPrompt, contents, modelIndex, attempt + 1)
    }
    throw err
  }
}

// ── Convert romanized text to native script ───────────────────
// "meri jaan" → "मेरी जान"  |  "vanakkam" → "வணக்கம்"
async function convertToNativeScript(text, language) {
  if (language === 'en') return text

  // Already has native script
  const hasNative = /[\u0B80-\u0BFF\u0900-\u097F\u0C00-\u0C7F\u0D00-\u0D7F\u0C80-\u0CFF\u0980-\u09FF\u0600-\u06FF]/.test(text)
  if (hasNative) return text

  const langNames = {
    ta:'Tamil', hi:'Hindi', te:'Telugu', ml:'Malayalam',
    kn:'Kannada', mr:'Marathi', bn:'Bengali', ar:'Arabic',
  }
  const langName = langNames[language] || language

  try {
    const apiKey   = process.env.GEMINI_API_KEY
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            role:  'user',
            parts: [{ text: `Convert this romanized ${langName} text into ${langName} native script.
Rules:
- Return ONLY the converted text, nothing else
- Keep English words in English
- Remove all emojis
- No explanations

Text: "${text}"` }]
          }],
          generationConfig: { maxOutputTokens: 512, temperature: 0.1 }
        }),
      }
    )
    if (!response.ok) return text
    const data = await response.json()
    return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || text
  } catch {
    return text
  }
}

// ══════════════════════════════════════════════════════════════
//  ROUTES
// ══════════════════════════════════════════════════════════════

// Health check — to verify server is running
app.get('/', (req, res) => {
  res.json({ status: 'VoicePersona backend is running ✓' })
})

// ── POST /chat — main chat endpoint ──────────────────────────
// Body: { systemPrompt, messages }
// Returns: { reply }
app.post('/chat', async (req, res) => {
  try {
    const { systemPrompt, messages } = req.body

    if (!systemPrompt || !messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'systemPrompt and messages are required' })
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'Gemini API key not configured on server' })
    }

    const reply = await callGemini(systemPrompt, messages)
    res.json({ reply })

  } catch (err) {
    console.error('Chat error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// ── POST /convert-script — romanized → native script ─────────
// Body: { text, language }
// Returns: { converted }
app.post('/convert-script', async (req, res) => {
  try {
    const { text, language } = req.body

    if (!text || !language) {
      return res.status(400).json({ error: 'text and language are required' })
    }

    const converted = await convertToNativeScript(text, language)
    res.json({ converted })

  } catch (err) {
    console.error('Convert script error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// ── Start server ──────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✓ VoicePersona backend running on http://localhost:${PORT}`)
})
