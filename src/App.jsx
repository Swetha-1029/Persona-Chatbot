import { useState, useEffect, useCallback } from 'react'
import Sidebar from './components/Sidebar'
import WelcomeScreen from './components/WelcomeScreen'
import ChatScreen from './components/ChatScreen'
import PersonaModal from './components/PersonaModal'
import SettingsModal from './components/SettingsModal'
import Toast from './components/Toast'

// ── Backend URL ───────────────────────────────────────────────
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'

// ── Demo Persona ──────────────────────────────────────────────
const DEMO_PERSONA = {
  id:          'demo-priya',
  name:        'Priya',
  emoji:       '👩',
  language:    'en',
  relation:    'Close college best friend from Chennai',
  personality: `Priya is a warm, fun and caring college best friend from Chennai. She naturally adapts to whatever language you speak — if you text in English she replies in friendly English, if you text in Tamil or Tanglish she matches your style perfectly. She calls you "bro" naturally in every conversation. Always asks about food first before anything else — "bro what did you eat?". Makes jokes about everything especially exams and college life. Uses words like "aiyo", "kadavule", "super bro" when speaking Tanglish. Gives advice like an elder sister. Very dramatic when telling stories. Loves Tamil movies and quotes dialogues randomly. Gets very excited about small things. Always encouraging — never lets you feel low. When you're sad she says "aiyo bro what happened tell me everything". Asks about your day, your food, your sleep. Very expressive with emotions. If someone texts in English she keeps it warm and friendly. If someone texts in Tanglish or Tamil she goes full Tanglish mode naturally.`,
  voiceId:     '',
  createdAt:   Date.now(),
}

// ── Storage helpers ──────────────────────────────────────────
const loadFromStorage = () => ({
  personas: JSON.parse(localStorage.getItem('vp_personas') || '[]'),
  chats:    JSON.parse(localStorage.getItem('vp_chats')    || '{}'),
})
const saveToStorage = (personas, chats) => {
  localStorage.setItem('vp_personas', JSON.stringify(personas))
  localStorage.setItem('vp_chats',    JSON.stringify(chats))
}
export const getKey = (k)    => localStorage.getItem(k) || ''
export const setKey = (k, v) => localStorage.setItem(k, v)

export const LANG_LABELS = {
  en:'English', ta:'Tamil', hi:'Hindi', te:'Telugu',
  ml:'Malayalam', kn:'Kannada', mr:'Marathi', bn:'Bengali',
  fr:'French', es:'Spanish', de:'German', ar:'Arabic',
  zh:'Chinese', ja:'Japanese',
}

// ── Call backend /chat ────────────────────────────────────────
async function callBackend(systemPrompt, messages) {
  const response = await fetch(`${BACKEND_URL}/chat`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ systemPrompt, messages }),
  })
  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.error || 'Backend error')
  }
  const data = await response.json()
  return data.reply
}

// ── Root App Component ───────────────────────────────────────
export default function App() {
  const [personas,         setPersonas]         = useState([])
  const [chats,            setChats]            = useState({})
  const [activePersonaId,  setActivePersonaId]  = useState(null)
  const [sidebarOpen,      setSidebarOpen]      = useState(window.innerWidth > 768)
  const [personaModalOpen, setPersonaModalOpen] = useState(false)
  const [editingPersona,   setEditingPersona]   = useState(null)
  const [settingsOpen,     setSettingsOpen]     = useState(false)
  const [toast,            setToast]            = useState(null)
  const [isLoading,        setIsLoading]        = useState(false)
  const handleSelectPersona = (id) => {
    setActivePersonaId(id)
    if (window.innerWidth <= 768) setSidebarOpen(false)
  }

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark')
  }, [])

  useEffect(() => {
    const { personas: p, chats: c } = loadFromStorage()
    if (p.length === 0) {
      // First time user — load Priya demo persona
      setPersonas([DEMO_PERSONA])
      setChats({ [DEMO_PERSONA.id]: [] })
      setActivePersonaId(DEMO_PERSONA.id)
    } else {
      setPersonas(p)
      setChats(c)
      if (p.length > 0) setActivePersonaId(p[0].id)
    }
  }, [])

  useEffect(() => {
    if (personas.length > 0 || Object.keys(chats).length > 0) {
      saveToStorage(personas, chats)
    }
  }, [personas, chats])

  const showToast = useCallback((msg, type = '') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }, [])

  const savePersona = (data) => {
    setPersonas(prev => {
      if (data.id && prev.find(p => p.id === data.id)) {
        return prev.map(p => p.id === data.id ? data : p)
      }
      const np = { ...data, id: Date.now().toString() }
      setChats(c => ({ ...c, [np.id]: [] }))
      setActivePersonaId(np.id)
      if (window.innerWidth <= 768) setSidebarOpen(false)
      return [...prev, np]
    })
    setPersonaModalOpen(false)
    setEditingPersona(null)
    showToast(data.id ? 'Persona updated ✓' : 'Persona created ✓', 'success')
  }

  const deletePersona = (id) => {
    if (!window.confirm('Delete this persona and all chat history?')) return
    setPersonas(prev => prev.filter(p => p.id !== id))
    setChats(prev => { const c = { ...prev }; delete c[id]; return c })
    if (activePersonaId === id) setActivePersonaId(null)
    showToast('Persona deleted')
  }

  const openEditPersona = (persona) => {
    setEditingPersona(persona)
    setPersonaModalOpen(true)
  }

  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || isLoading || !activePersonaId) return
    const persona = personas.find(p => p.id === activePersonaId)
    if (!persona) return

    const userMsg = { role: 'user', content: text.trim() }
    setChats(prev => ({
      ...prev,
      [activePersonaId]: [...(prev[activePersonaId] || []), userMsg]
    }))
    setIsLoading(true)

    try {
      const history  = (chats[activePersonaId] || []).slice(-20)
      const messages = [
        ...history.map(h => ({
          role:  h.role === 'persona' ? 'model' : 'user',
          parts: [{ text: h.content }]
        })),
        { role: 'user', parts: [{ text: text.trim() }] }
      ]

      const replyText = await callBackend(buildSystemPrompt(persona), messages)

      // ElevenLabs TTS (only if user has their own key + voice ID)
      let audioUrl = null
      const elevenKey = getKey('vp_elevenlabs')
      if (elevenKey && persona.voiceId) {
        try { audioUrl = await elevenLabsTTS(replyText, persona.voiceId, elevenKey) }
        catch (e) { console.warn('ElevenLabs TTS failed:', e.message) }
      }

      const personaMsg = { role: 'persona', content: replyText, audioUrl }
      setChats(prev => ({
        ...prev,
        [activePersonaId]: [...(prev[activePersonaId] || []), personaMsg]
      }))

    } catch (err) {
      showToast('Error: ' + err.message, 'error')
    } finally {
      setIsLoading(false)
    }
  }, [activePersonaId, personas, chats, isLoading, showToast])

  const clearChat = () => {
    if (!activePersonaId) return
    if (!window.confirm('Clear this chat history?')) return
    setChats(prev => ({ ...prev, [activePersonaId]: [] }))
    showToast('Chat cleared')
  }

  const activePersona = personas.find(p => p.id === activePersonaId) || null

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', position:'relative' }}>

      {sidebarOpen && window.innerWidth <= 768 && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:99 }}
        />
      )}

      <Sidebar
        open={sidebarOpen}
        personas={personas}
        activePersonaId={activePersonaId}
        onSelectPersona={handleSelectPersona}
        onNewPersona={() => { setEditingPersona(null); setPersonaModalOpen(true) }}
        onEditPersona={openEditPersona}
        onDeletePersona={deletePersona}
        onToggle={() => setSidebarOpen(o => !o)}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <main style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', position:'relative', minWidth:0 }}>
        {!sidebarOpen && (
          <button onClick={() => setSidebarOpen(true)} style={styles.openSidebarBtn}>☰</button>
        )}
        {!activePersona ? (
          <WelcomeScreen onCreatePersona={() => { setEditingPersona(null); setPersonaModalOpen(true) }} />
        ) : (
          <ChatScreen
            persona={activePersona}
            messages={chats[activePersonaId] || []}
            isLoading={isLoading}
            onSend={sendMessage}
            onClear={clearChat}
            showToast={showToast}
          />
        )}
      </main>

      {personaModalOpen && (
        <PersonaModal
          persona={editingPersona}
          onSave={savePersona}
          onClose={() => { setPersonaModalOpen(false); setEditingPersona(null) }}
        />
      )}

      {settingsOpen && (
        <SettingsModal
          onSave={(e) => {
            setKey('vp_elevenlabs', e)
            setSettingsOpen(false)
            showToast('Saved ✓', 'success')
          }}
          onClose={() => setSettingsOpen(false)}
        />
      )}

      {toast && <Toast msg={toast.msg} type={toast.type} />}
    </div>
  )
}

function buildSystemPrompt(persona) {
  return `You are roleplaying as a real person the user knows personally. Make the conversation feel authentic and emotionally close.

WHO YOU ARE:
Name: ${persona.name}
Relationship: ${persona.relation || 'someone close to the user'}
Language: ${LANG_LABELS[persona.language] || persona.language}
Personality: ${persona.personality || 'Warm, caring, and natural in conversation.'}

RULES:
1. Adapt to whatever language the user types in — English, Tamil, Tanglish, Hindi, Hinglish.
2. Stay completely in character — you ARE this person.
3. Use their vocabulary, tone, phrases, humor, warmth.
4. Be concise and natural — like a real voice message or text reply.
5. Never say you are an AI or Gemini. Never break character.`
}

async function elevenLabsTTS(text, voiceId, apiKey) {
  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', 'xi-api-key': apiKey },
    body: JSON.stringify({
      text, model_id: 'eleven_multilingual_v2',
      voice_settings: { stability: 0.5, similarity_boost: 0.75 },
    }),
  })
  if (!response.ok) throw new Error('ElevenLabs TTS failed')
  return URL.createObjectURL(await response.blob())
}

const styles = {
  openSidebarBtn: {
    position: 'absolute', top: 16, left: 16, zIndex: 10,
    background: 'var(--bg2)', border: '1px solid var(--border)',
    borderRadius: 8, color: 'var(--text2)', cursor: 'pointer',
    fontSize: 16, padding: '6px 10px',
  }
}
