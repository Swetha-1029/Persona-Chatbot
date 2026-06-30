import { LANG_LABELS } from '../App'

export default function Sidebar({
  open, personas, activePersonaId,
  onSelectPersona, onNewPersona, onEditPersona,
  onDeletePersona, onToggle, onOpenSettings,
}) {
  return (
    <aside style={{ ...s.sidebar, transform: open ? 'none' : 'translateX(-100%)' }}>

      {/* Header */}
      <div style={s.header}>
        <div style={s.logo}>VP</div>
        <span style={s.logoText}>VoicePersona</span>
        <button onClick={onToggle} style={s.toggleBtn} title="Close sidebar">✕</button>
      </div>

      {/* New Persona Button */}
      <button onClick={onNewPersona} style={s.newBtn}>
        <span style={{ fontSize: 20, lineHeight: 1 }}>+</span>
        New Persona Chat
      </button>

      {/* Persona List */}
      <div style={s.label}>PERSONAS</div>
      <div style={s.list}>
        {personas.length === 0 && (
          <div style={s.empty}>No personas yet</div>
        )}
        {personas.map(p => (
          <PersonaItem
            key={p.id}
            persona={p}
            isActive={p.id === activePersonaId}
            onSelect={() => onSelectPersona(p.id)}
            onEdit={() => onEditPersona(p)}
            onDelete={() => onDeletePersona(p.id)}
          />
        ))}
      </div>

      {/* Footer */}
      <div style={s.footer}>
        <button onClick={onOpenSettings} style={s.settingsBtn}>⚙ Settings</button>
      </div>
    </aside>
  )
}

function PersonaItem({ persona, isActive, onSelect, onEdit, onDelete }) {
  return (
    <div
      onClick={onSelect}
      style={{
        ...s.item,
        background: isActive ? 'var(--bg4)' : 'transparent',
        borderLeft: isActive ? '3px solid var(--accent)' : '3px solid transparent',
      }}
    >
      <div style={s.avatar}>{persona.emoji}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={s.itemName}>{persona.name}</div>
        <div style={s.itemLang}>{LANG_LABELS[persona.language] || persona.language}</div>
      </div>
      <button
        onClick={e => { e.stopPropagation(); onEdit() }}
        style={s.iconSmallBtn}
        title="Edit"
      >✎</button>
      <button
        onClick={e => { e.stopPropagation(); onDelete() }}
        style={{ ...s.iconSmallBtn, color: 'var(--red)' }}
        title="Delete"
      >✕</button>
    </div>
  )
}

const s = {
  sidebar: {
    width: 270, minWidth: 270, height: '100vh',
    background: 'var(--bg2)', borderRight: '1px solid var(--border)',
    display: 'flex', flexDirection: 'column',
    transition: 'transform 0.3s ease', zIndex: 100,
    position: 'relative', flexShrink: 0,
  },
  header: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '20px 16px 16px', borderBottom: '1px solid var(--border)',
  },
  logo: {
    width: 32, height: 32, background: 'var(--accent)', color: '#1a1207',
    borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: 'var(--font-serif)', fontSize: 13, fontWeight: 'bold', flexShrink: 0,
  },
  logoText: {
    fontFamily: 'var(--font-serif)', fontSize: 16,
    color: 'var(--accent2)', flex: 1,
  },
  toggleBtn: {
    background: 'none', border: 'none', color: 'var(--text3)',
    cursor: 'pointer', fontSize: 14, padding: 4,
  },
  newBtn: {
    margin: '14px 12px 8px',
    padding: '10px 14px',
    background: 'var(--accent-bg)', border: '1px solid var(--accent)',
    borderRadius: 12, color: 'var(--accent2)',
    fontFamily: 'var(--font-mono)', fontSize: 13, cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s',
  },
  label: {
    padding: '12px 16px 6px', fontSize: 10,
    letterSpacing: '1.5px', color: 'var(--text3)',
  },
  list: { flex: 1, overflowY: 'auto', padding: '4px 8px' },
  empty: { padding: 16, fontSize: 12, color: 'var(--text3)', textAlign: 'center' },
  item: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '10px 10px', borderRadius: 10,
    cursor: 'pointer', marginBottom: 2, transition: 'background 0.15s',
  },
  avatar: {
    width: 36, height: 36, background: 'var(--bg4)',
    borderRadius: '50%', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    fontSize: 18, flexShrink: 0, border: '1px solid var(--border)',
  },
  itemName: {
    fontSize: 13, color: 'var(--text)',
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
  },
  itemLang: { fontSize: 11, color: 'var(--text3)' },
  iconSmallBtn: {
    background: 'none', border: 'none',
    color: 'var(--text3)', cursor: 'pointer',
    fontSize: 13, padding: '3px 5px', borderRadius: 4,
  },
  footer: { padding: 12, borderTop: '1px solid var(--border)' },
  settingsBtn: {
    width: '100%', padding: 9,
    background: 'none', border: '1px solid var(--border)',
    borderRadius: 12, color: 'var(--text2)',
    fontFamily: 'var(--font-mono)', fontSize: 12, cursor: 'pointer',
    letterSpacing: '0.5px',
  },
}
