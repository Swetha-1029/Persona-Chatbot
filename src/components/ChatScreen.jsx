import { useRef, useEffect, useState } from 'react'
import { LANG_LABELS } from '../App'
import useVoice from './hooks/useVoice'

export default function ChatScreen({ persona, messages, isLoading, onSend, onClear, showToast }) {
  const messagesEndRef = useRef(null)
  const textInputRef   = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  useEffect(() => {
    textInputRef.current?.focus()
  }, [persona.id])

  const {
    isRecording, transcript, setTranscript,
    timer, startRecording, stopRecording,
    cancelRecording, sendTranscript,
  } = useVoice({ onTranscript: onSend, showToast, language: persona.language })

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      const val = textInputRef.current?.value?.trim()
      if (val) { onSend(val); textInputRef.current.value = '' }
    }
  }

  const handleSend = () => {
    const val = textInputRef.current?.value?.trim()
    if (val) { onSend(val); textInputRef.current.value = '' }
  }

  // Whether to show transcript editor (after recording stopped, before sending)
  const showPreview = !isRecording && transcript.length > 0

  return (
    <div style={s.container}>

      {/* ── Header ── */}
      <div style={s.header}>
        <div style={s.headerLeft}>
          <div style={s.avatar}>{persona.emoji}</div>
          <div>
            <div style={s.personaName}>{persona.name}</div>
            <div style={s.personaLang}>{LANG_LABELS[persona.language] || persona.language}</div>
          </div>
        </div>
        <button onClick={onClear} style={s.clearBtn} title="Clear chat">🗑</button>
      </div>

      {/* ── Messages ── */}
      <div style={s.messages}>
        {messages.length === 0 && (
          <div style={s.emptyMsg}>Say hello to start the conversation ✦</div>
        )}
        {messages.map((msg, i) => (
          <Message key={i} msg={msg} persona={persona} />
        ))}
        {isLoading && (
          <div style={{ ...s.msgWrapper, alignSelf: 'flex-start', alignItems: 'flex-start' }}>
            <div style={s.msgLabel}>thinking...</div>
            <div style={s.typingBubble}>
              <span style={{ ...s.dot, animationDelay: '0s' }} />
              <span style={{ ...s.dot, animationDelay: '0.2s' }} />
              <span style={{ ...s.dot, animationDelay: '0.4s' }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Input Area ── */}
      <div style={s.inputArea}>

        {/* ── RECORDING BAR — shown while mic is active ── */}
        {isRecording && (
          <div style={s.recordingBar}>
            {/* Delete / cancel */}
            <button onClick={cancelRecording} style={s.cancelBtn} title="Cancel recording">🗑</button>

            {/* Waveform animation + timer */}
            <div style={s.waveArea}>
              <div style={s.waveform}>
                {[...Array(18)].map((_, i) => (
                  <span key={i} style={{
                    ...s.waveBar,
                    animationDelay: `${i * 0.08}s`,
                    height: `${10 + Math.random() * 20}px`,
                  }} />
                ))}
              </div>
              <span style={s.timerText}>{timer}</span>
            </div>

            {/* Stop & send */}
            <button onClick={stopRecording} style={s.stopSendBtn} title="Stop and send">
              ✓
            </button>
          </div>
        )}

        {/* ── TRANSCRIPT PREVIEW — shown after stopping, before sending ── */}
        {showPreview && (
          <div style={s.previewBar}>
            <div style={s.previewLabel}>🎙 Review before sending — edit if needed:</div>
            <div style={s.previewRow}>
              {/* Delete transcript */}
              <button onClick={cancelRecording} style={s.cancelBtn} title="Delete">🗑</button>

              {/* Editable transcript */}
              <textarea
                style={s.previewInput}
                value={transcript}
                onChange={e => setTranscript(e.target.value)}
                rows={2}
                autoFocus
              />

              {/* Send transcript */}
              <button
                onClick={() => sendTranscript(transcript)}
                style={s.stopSendBtn}
                title="Send"
              >↑</button>
            </div>
          </div>
        )}

        {/* ── NORMAL INPUT ROW ── */}
        {!isRecording && !showPreview && (
          <div style={s.inputRow}>
            {/* Mic button — click to start recording */}
            <button
              onClick={startRecording}
              style={s.micBtn}
              title="Click to speak"
            >🎙</button>

            <textarea
              ref={textInputRef}
              style={s.textInput}
              placeholder="Type a message or click mic to speak..."
              rows={1}
              onKeyDown={handleKeyDown}
              onInput={e => {
                e.target.style.height = 'auto'
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
              }}
            />

            <button onClick={handleSend} style={s.sendBtn}>↑</button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Single message bubble ─────────────────────────────────────
function Message({ msg, persona }) {
  const isUser  = msg.role === 'user'
  const label   = isUser ? 'You' : persona.name
  const audioRef = useRef(null)

  useEffect(() => {
    if (msg.audioUrl && audioRef.current) {
      audioRef.current.play().catch(() => {})
    }
  }, [msg.audioUrl])

  return (
    <div style={{
      ...s.msgWrapper,
      alignSelf: isUser ? 'flex-end' : 'flex-start',
      alignItems: isUser ? 'flex-end' : 'flex-start',
      animation: 'msgIn 0.25s ease',
    }}>
      <div style={s.msgLabel}>{label}</div>
      <div style={isUser ? s.userBubble : s.personaBubble}>
        {msg.content.split('\n').map((line, i) => (
          <span key={i}>{line}{i < msg.content.split('\n').length - 1 && <br />}</span>
        ))}
      </div>
      {msg.audioUrl && (
        <audio ref={audioRef} controls src={msg.audioUrl} style={s.audio} />
      )}
    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────
const s = {
  container: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },

  header: {
    padding: '16px 20px', borderBottom: '1px solid var(--border)',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    background: 'var(--bg2)',
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 12 },
  avatar: {
    width: 40, height: 40, background: 'var(--bg4)', borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 20, border: '1px solid var(--border)',
  },
  personaName: { fontFamily: 'var(--font-serif)', fontSize: 18, color: 'var(--accent2)' },
  personaLang: { fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px' },
  clearBtn: {
    background: 'none', border: '1px solid var(--border)', borderRadius: 8,
    color: 'var(--text2)', cursor: 'pointer', padding: '7px 10px', fontSize: 14,
  },

  messages: {
    flex: 1, overflowY: 'auto', padding: '24px 20px',
    display: 'flex', flexDirection: 'column', gap: 18,
    background: 'var(--chat-bg)',
  },
  emptyMsg: { textAlign: 'center', color: 'var(--text3)', fontSize: 13, marginTop: 60 },

  msgWrapper: { display: 'flex', flexDirection: 'column', maxWidth: '72%' },
  msgLabel: {
    fontSize: 10, letterSpacing: '1px', color: 'var(--text3)',
    marginBottom: 5, textTransform: 'uppercase',
  },
  userBubble: {
    padding: '12px 16px', borderRadius: 16, borderBottomRightRadius: 4,
    background: 'var(--user-bubble)', border: '1px solid var(--user-border)',
    fontSize: 14, lineHeight: 1.65, wordBreak: 'break-word', color: 'var(--text)',
  },
  personaBubble: {
    padding: '12px 16px', borderRadius: 16, borderBottomLeftRadius: 4,
    background: 'var(--persona-bubble)', border: '1px solid var(--persona-border)',
    fontSize: 14, lineHeight: 1.65, wordBreak: 'break-word', color: 'var(--text)',
  },
  audio: { marginTop: 8, height: 36, borderRadius: 20, outline: 'none' },
  typingBubble: {
    padding: '12px 16px', borderRadius: 16, borderBottomLeftRadius: 4,
    background: 'var(--bg3)', border: '1px solid var(--border)',
    display: 'flex', alignItems: 'center', gap: 5,
  },
  dot: {
    display: 'inline-block', width: 7, height: 7,
    background: 'var(--text3)', borderRadius: '50%',
    animation: 'typingBounce 1.2s infinite ease-in-out',
  },

  // Input area
  inputArea: {
    borderTop: '1px solid var(--border)', background: 'var(--bg2)',
    padding: '12px 16px 16px',
  },
  inputRow: { display: 'flex', alignItems: 'flex-end', gap: 10 },
  micBtn: {
    width: 44, height: 44, borderRadius: '50%',
    background: 'var(--bg3)', border: '1px solid var(--border)',
    color: 'var(--text2)', fontSize: 20, cursor: 'pointer',
    flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  textInput: {
    flex: 1, background: 'var(--bg3)', border: '1px solid var(--border)',
    borderRadius: 12, color: 'var(--text)', fontFamily: 'var(--font-mono)',
    fontSize: 14, padding: '11px 14px', resize: 'none', outline: 'none',
    lineHeight: 1.5, maxHeight: 120, overflowY: 'auto',
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: '50%',
    background: 'var(--accent)', border: 'none', color: '#1a1207',
    fontSize: 18, fontWeight: 'bold', cursor: 'pointer',
    flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
  },

  // Recording bar (shown while mic is active)
  recordingBar: {
    display: 'flex', alignItems: 'center', gap: 12,
    background: 'var(--bg3)', borderRadius: 16,
    padding: '10px 14px', marginBottom: 10,
    border: '1px solid var(--red)',
  },
  cancelBtn: {
    background: 'none', border: 'none', fontSize: 18,
    cursor: 'pointer', color: 'var(--red)', flexShrink: 0,
    padding: '4px',
  },
  waveArea: {
    flex: 1, display: 'flex', alignItems: 'center', gap: 10,
    overflow: 'hidden',
  },
  waveform: {
    display: 'flex', alignItems: 'center', gap: 2, flex: 1,
  },
  waveBar: {
    width: 3, borderRadius: 2,
    background: 'var(--red)',
    animation: 'typingBounce 0.8s infinite ease-in-out',
    display: 'inline-block',
  },
  timerText: {
    fontSize: 13, color: 'var(--red)',
    fontFamily: 'var(--font-mono)', flexShrink: 0,
    letterSpacing: '1px',
  },
  stopSendBtn: {
    width: 40, height: 40, borderRadius: '50%',
    background: 'var(--accent)', border: 'none',
    color: '#1a1207', fontSize: 18, fontWeight: 'bold',
    cursor: 'pointer', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },

  // Transcript preview bar
  previewBar: {
    background: 'var(--bg3)', borderRadius: 16,
    padding: '10px 14px', marginBottom: 10,
    border: '1px solid var(--accent)',
  },
  previewLabel: {
    fontSize: 11, color: 'var(--text3)',
    marginBottom: 8, letterSpacing: '0.3px',
  },
  previewRow: {
    display: 'flex', alignItems: 'flex-end', gap: 10,
  },
  previewInput: {
    flex: 1, background: 'var(--bg2)', border: '1px solid var(--border)',
    borderRadius: 10, color: 'var(--text)', fontFamily: 'var(--font-mono)',
    fontSize: 14, padding: '10px 12px', resize: 'none', outline: 'none',
    lineHeight: 1.5,
  },
}
