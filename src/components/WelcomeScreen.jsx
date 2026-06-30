// Shown when no persona is selected yet
export default function WelcomeScreen({ onCreatePersona }) {
  return (
    <div style={s.container}>
      <div style={s.content}>
        <div style={s.logo}>VP</div>
        <h1 style={s.title}>VoicePersona</h1>
        <p style={s.sub}>Talk to anyone. In their voice.</p>
        <button onClick={onCreatePersona} style={s.btn}>
          Create your first persona →
        </button>
      </div>
    </div>
  )
}

const s = {
  container: {
    flex: 1, display: 'flex',
    alignItems: 'center', justifyContent: 'center',
  },
  content: {
    textAlign: 'center',
    animation: 'fadeUp 0.6s ease',
  },
  logo: {
    width: 64, height: 64,
    background: 'var(--accent)', color: '#1a1207',
    borderRadius: 18,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: 'var(--font-serif)', fontSize: 24, fontWeight: 'bold',
    margin: '0 auto 24px',
    boxShadow: '0 0 40px var(--accent-glow)',
  },
  title: {
    fontFamily: 'var(--font-serif)', fontSize: 42,
    color: 'var(--accent2)', marginBottom: 10, fontWeight: 'normal',
  },
  sub: {
    fontSize: 15, color: 'var(--text2)',
    marginBottom: 36, letterSpacing: '0.5px',
  },
  btn: {
    padding: '13px 28px',
    background: 'var(--accent)', border: 'none',
    borderRadius: 12, color: '#1a1207',
    fontFamily: 'var(--font-mono)', fontSize: 14,
    fontWeight: 500, cursor: 'pointer',
    transition: 'all 0.2s', letterSpacing: '0.3px',
  },
}