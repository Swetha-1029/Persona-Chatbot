// Small notification that appears at the bottom of the screen
export default function Toast({ msg, type }) {
  const colors = {
    success: { border: 'var(--green)',  color: 'var(--green)' },
    error:   { border: 'var(--red)',    color: 'var(--red)'   },
    '':      { border: 'var(--border2)', color: 'var(--text)' },
  }
  const c = colors[type] || colors['']

  return (
    <div style={{
      position: 'fixed', bottom: 30, left: '50%',
      transform: 'translateX(-50%)',
      background: 'var(--bg4)',
      border: `1px solid ${c.border}`,
      borderRadius: 8, padding: '10px 20px',
      fontSize: 13, color: c.color, zIndex: 999,
      pointerEvents: 'none',
      animation: 'fadeUp 0.3s ease',
      whiteSpace: 'nowrap',
    }}>
      {msg}
    </div>
  )
}
