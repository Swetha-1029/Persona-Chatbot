import { useState } from 'react'

const LANGUAGES = [
  { code:'en', label:'English' }, { code:'ta', label:'Tamil' },
  { code:'hi', label:'Hindi' },   { code:'te', label:'Telugu' },
  { code:'ml', label:'Malayalam'},{ code:'kn', label:'Kannada' },
  { code:'mr', label:'Marathi' }, { code:'bn', label:'Bengali' },
  { code:'fr', label:'French' },  { code:'es', label:'Spanish' },
  { code:'de', label:'German' },  { code:'ar', label:'Arabic' },
  { code:'zh', label:'Chinese' }, { code:'ja', label:'Japanese'},
]

const EMOJIS = ['👤','👩','👨','👵','👴','👧','👦','🧑','👩‍🦱','👨‍🦳','🧓','👩‍🦰','🐱','🐶','🌸','⭐']

// Modal for creating or editing a persona
export default function PersonaModal({ persona, onSave, onClose }) {
  // Pre-fill form if editing, blank if creating
  const [form, setForm] = useState({
    id:          persona?.id          || '',
    name:        persona?.name        || '',
    relation:    persona?.relation    || '',
    language:    persona?.language    || 'en',
    personality: persona?.personality || '',
    voiceId:     persona?.voiceId     || '',
    emoji:       persona?.emoji       || '👤',
  })

  const [audioFiles, setAudioFiles] = useState([])

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const handleSave = () => {
    if (!form.name.trim()) { alert('Please enter a name'); return }
    onSave(form)
  }

  const handleFiles = (files) => {
    const audio = [...files].filter(f => f.type.startsWith('audio/'))
    setAudioFiles(prev => [...prev, ...audio])
  }

  const handleDrop = (e) => {
    e.preventDefault()
    handleFiles(e.dataTransfer.files)
  }

  return (
    <div style={s.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={s.modal}>

        {/* Header */}
        <div style={s.header}>
          <h2 style={s.title}>{persona ? 'Edit Persona' : 'Create Persona'}</h2>
          <button onClick={onClose} style={s.closeBtn}>✕</button>
        </div>

        {/* Body */}
        <div style={s.body}>

          <Field label="Name">
            <input style={s.input} value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder="e.g. Grandma, Best Friend, Ravi..." />
          </Field>

          <Field label="Relationship / Who are they?">
            <input style={s.input} value={form.relation}
              onChange={e => set('relation', e.target.value)}
              placeholder="e.g. My grandmother from Chennai" />
          </Field>

          <Field label="Language">
            <select style={s.input} value={form.language}
              onChange={e => set('language', e.target.value)}>
              {LANGUAGES.map(l => (
                <option key={l.code} value={l.code}>{l.label}</option>
              ))}
            </select>
          </Field>

          <Field label={<>Personality & how they spoke <span style={s.hint}>(more detail = more realistic)</span></>}>
            <textarea style={{ ...s.input, resize: 'vertical' }} rows={4}
              value={form.personality}
              onChange={e => set('personality', e.target.value)}
              placeholder="e.g. Always warm, called me 'kanna', mixed Tamil and English, told village stories, gave advice with proverbs, laughed a lot..." />
          </Field>

          <Field label={<>ElevenLabs Voice ID <span style={s.hint}>(paste after cloning their voice)</span></>}>
            <input style={s.input} value={form.voiceId}
              onChange={e => set('voiceId', e.target.value)}
              placeholder="e.g. 21m00Tcm4TlvDq8ikWAM" />
            <div style={s.hintBox}>
              Don't have one yet? <strong>Text-only mode</strong> works without it.
              Get it from ElevenLabs → Voices → your cloned voice → copy ID from URL.
            </div>
          </Field>

          <Field label={<>Upload voice samples <span style={s.hint}>(any audio format)</span></>}>
            <div
              style={s.uploadArea}
              onClick={() => document.getElementById('audioInput').click()}
              onDragOver={e => e.preventDefault()}
              onDrop={handleDrop}
            >
              <div style={{ fontSize: 28, marginBottom: 8 }}>🎙</div>
              <div>Drop audio files here or <span style={{ color:'var(--accent)', textDecoration:'underline' }}>browse</span></div>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>
                WhatsApp, Snapchat, call recordings — any format
              </div>
              <input id="audioInput" type="file" accept="audio/*" multiple style={{ display:'none' }}
                onChange={e => handleFiles(e.target.files)} />
            </div>
            {audioFiles.length > 0 && (
              <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:8 }}>
                {audioFiles.map((f, i) => (
                  <div key={i} style={s.fileTag}>
                    🎙 {f.name}
                    <button onClick={() => setAudioFiles(p => p.filter((_, j) => j !== i))}
                      style={{ background:'none', border:'none', color:'var(--text3)', cursor:'pointer', fontSize:12 }}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </Field>

          <Field label="Avatar emoji">
            <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:8 }}>
              {EMOJIS.map(e => (
                <span key={e} onClick={() => set('emoji', e)}
                  style={{ fontSize:22, cursor:'pointer', padding:4, borderRadius:6,
                    background: form.emoji === e ? 'var(--bg4)' : 'transparent' }}>
                  {e}
                </span>
              ))}
            </div>
            <input style={{ ...s.input, width:60, textAlign:'center', fontSize:'1.4rem' }}
              value={form.emoji} maxLength={2}
              onChange={e => set('emoji', e.target.value)} />
          </Field>

        </div>

        {/* Footer */}
        <div style={s.footer}>
          <button onClick={onClose} style={s.cancelBtn}>Cancel</button>
          <button onClick={handleSave} style={s.saveBtn}>Save Persona</button>
        </div>
      </div>
    </div>
  )
}

// Reusable form field wrapper
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
    borderRadius:16, width:'100%', maxWidth:520, maxHeight:'90vh',
    display:'flex', flexDirection:'column', overflow:'hidden',
    animation:'modalIn 0.25s ease',
  },
  header: {
    padding:'20px 22px 16px', borderBottom:'1px solid var(--border)',
    display:'flex', alignItems:'center', justifyContent:'space-between',
  },
  title: { fontFamily:'var(--font-serif)', fontSize:22, color:'var(--accent2)', fontWeight:'normal' },
  closeBtn: { background:'none', border:'none', color:'var(--text3)', cursor:'pointer', fontSize:16 },
  body: { flex:1, overflowY:'auto', padding:'20px 22px', display:'flex', flexDirection:'column', gap:16 },
  footer: { padding:'16px 22px', borderTop:'1px solid var(--border)', display:'flex', justifyContent:'flex-end', gap:10 },
  input: {
    background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:8,
    color:'var(--text)', fontFamily:'var(--font-mono)', fontSize:13,
    padding:'10px 12px', outline:'none', width:'100%',
  },
  hint: { fontSize:10, color:'var(--text3)', letterSpacing:0, textTransform:'none' },
  hintBox: {
    background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:8,
    padding:'10px 12px', fontSize:12, color:'var(--text2)', lineHeight:1.5, marginTop:4,
  },
  uploadArea: {
    border:'1.5px dashed var(--border2)', borderRadius:10,
    padding:22, textAlign:'center', cursor:'pointer',
    color:'var(--text2)', fontSize:13,
  },
  fileTag: {
    background:'var(--bg4)', border:'1px solid var(--border)',
    borderRadius:20, padding:'4px 10px', fontSize:11, color:'var(--text2)',
    display:'flex', alignItems:'center', gap:6,
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
