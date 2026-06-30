import { useState } from 'react'
import { getKey } from '../App'

export default function SettingsModal({ onSave, onClose }) {
  const [elevenLabs, setElevenLabs] = useState(getKey('vp_elevenlabs'))

  return (
    <div style={s.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={s.modal}>

        <div style={s.header}>
          <h2 style={s.title}>Settings</h2>
          <button onClick={onClose} style={s.closeBtn}>✕</button>
        </div>

        <div style={s.body}>

          {/* AI Info box */}
          <div style={s.infoBox}>
            <div style={s.infoIcon}>🤖</div>
            <div>
              <div style={s.infoTitle}>AI is ready to use!</div>
              <div style={s.infoText}>No API key needed — the app's AI is fully configured. Just create a persona and start chatting!</div>
            </div>
          </div>

          {/* ElevenLabs — optional */}
          <div style={s.divider}>
            <span>Optional — Voice Cloning</span>
          </div>

          <Field label="ElevenLabs API Key">
            <input
              type="password" style={s.input}
              value={elevenLabs}
              onChange={e => setElevenLabs(e.target.value)}
              placeholder="Paste your ElevenLabs key for voice cloning..." />
          </Field>

          <div style={s.hintBox}>
            🎙 Add your ElevenLabs key to enable voice cloning — hear replies in a real person's voice. Get a free key at <strong>elevenlabs.io</strong>
          </div>

        </div>

        <div style={s.footer}>
          <button onClick={onClose} style={s.cancelBtn}>Cancel</button>
          <button onClick={() => onSave(elevenLabs.trim())} style={s.saveBtn}>
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
      <label style={{ fontSize:11, letterSpacing:'1px', textTransform:'uppercase', color:'var(--text2)' }}>
        {label}
      </label>
      {children}
    </div>
  )
}

const s = {
  overlay: {
    position:'fixed', inset:0, background:'rgba(0,0,0,0.7)',
    backdropFilter:'blur(4px)', zIndex:200,
    display:'flex', alignItems:'center', justifyContent:'center', padding:20,
  },
  modal: {
    background:'var(--bg2)', border:'1px solid var(--border2)',
    borderRadius:16, width:'100%', maxWidth:460,
    display:'flex', flexDirection:'column', overflow:'hidden',
    animation:'modalIn 0.25s ease',
  },
  header: {
    padding:'20px 22px 16px', borderBottom:'1px solid var(--border)',
    display:'flex', alignItems:'center', justifyContent:'space-between',
  },
  title: { fontFamily:'var(--font-serif)', fontSize:22, color:'var(--accent2)', fontWeight:'normal' },
  closeBtn: { background:'none', border:'none', color:'var(--text3)', cursor:'pointer', fontSize:16 },
  body: { padding:'20px 22px', display:'flex', flexDirection:'column', gap:16 },
  footer: { padding:'16px 22px', borderTop:'1px solid var(--border)', display:'flex', justifyContent:'flex-end', gap:10 },
  infoBox: {
    background: 'var(--accent-bg)',
    border: '1px solid var(--accent)',
    borderRadius: 12, padding: '14px 16px',
    display: 'flex', alignItems: 'flex-start', gap: 12,
  },
  infoIcon: { fontSize: 24, flexShrink: 0 },
  infoTitle: { fontSize: 14, color: 'var(--accent2)', fontWeight: 500, marginBottom: 4 },
  infoText: { fontSize: 12, color: 'var(--text2)', lineHeight: 1.5 },
  divider: {
    display: 'flex', alignItems: 'center', gap: 10,
    color: 'var(--text3)', fontSize: 11, letterSpacing: '1px',
    textTransform: 'uppercase',
  },
  input: {
    background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:8,
    color:'var(--text)', fontFamily:'var(--font-mono)', fontSize:13,
    padding:'10px 12px', outline:'none', width:'100%',
  },
  hintBox: {
    background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:8,
    padding:'12px 14px', fontSize:12, color:'var(--text2)', lineHeight:1.7,
  },
  cancelBtn: {
    padding:'10px 22px', background:'none', border:'1px solid var(--border)',
    borderRadius:12, color:'var(--text2)', fontFamily:'var(--font-mono)',
    fontSize:13, cursor:'pointer',
  },
  saveBtn: {
    padding:'10px 22px', background:'var(--accent)', border:'none',
    borderRadius:12, color:'#1a1207', fontFamily:'var(--font-mono)',
    fontSize:13, fontWeight:500, cursor:'pointer',
  },
}
