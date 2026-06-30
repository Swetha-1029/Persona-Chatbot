import { useState, useRef, useEffect } from 'react'

// Click mic to start, shows transcript preview, edit or delete before sending
// Auto-retries on network errors silently
export default function useVoice({ onTranscript, showToast }) {
  const [isRecording, setIsRecording] = useState(false)
  const [transcript,  setTranscript]  = useState('')
  const [timer,       setTimer]       = useState(0)
  const recognitionRef = useRef(null)
  const timerRef       = useRef(null)
  const retryCountRef  = useRef(0)
  const MAX_RETRIES    = 3

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => setTimer(t => t + 1), 1000)
    } else {
      clearInterval(timerRef.current)
      setTimer(0)
    }
    return () => clearInterval(timerRef.current)
  }, [isRecording])

  const startRecording = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { showToast('Use Chrome or Edge for voice input', 'error'); return }

    retryCountRef.current = 0
    createAndStart(SR)
  }

  const createAndStart = (SR) => {
    // Always get fresh SR constructor
    const SpeechRecognition = SR || window.SpeechRecognition || window.webkitSpeechRecognition

    try {
      if (recognitionRef.current) {
        recognitionRef.current.onend = null
        recognitionRef.current.onerror = null
        recognitionRef.current.stop()
      }
    } catch {}

    const recognition = new SpeechRecognition()
    recognition.lang            = 'en-IN' // en-IN understands English + Tanglish, stable
    recognition.continuous      = true
    recognition.interimResults  = true
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      setIsRecording(true)
      if (retryCountRef.current === 0) setTranscript('')
    }

    recognition.onresult = (e) => {
      let final = '', interim = ''
      for (let i = 0; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript + ' '
        else interim += e.results[i][0].transcript
      }
      setTranscript((final || interim).trim())
    }

    recognition.onerror = (e) => {
      if (e.error === 'network') {
        // Silently retry up to MAX_RETRIES times
        if (retryCountRef.current < MAX_RETRIES) {
          retryCountRef.current++
          setTimeout(() => createAndStart(SpeechRecognition), 800)
        } else {
          setIsRecording(false)
          showToast('Mic network issue — check your internet', 'error')
        }
        return
      }
      if (e.error === 'no-speech') {
        // Don't show error, just stop quietly
        setIsRecording(false)
        return
      }
      if (e.error === 'not-allowed') {
        setIsRecording(false)
        showToast('Allow microphone access in browser settings', 'error')
        return
      }
      // Any other error — retry once
      if (retryCountRef.current < 1) {
        retryCountRef.current++
        setTimeout(() => createAndStart(SpeechRecognition), 500)
      } else {
        setIsRecording(false)
      }
    }

    recognition.onend = () => {
      // If still supposed to be recording, restart (handles auto-stop after silence)
      if (isRecording && retryCountRef.current === 0) {
        try { recognition.start() } catch {}
      } else {
        setIsRecording(false)
      }
    }

    recognitionRef.current = recognition
    try { recognition.start() } catch {}
  }

  const stopRecording = () => {
    retryCountRef.current = 99 // prevent any retries
    if (recognitionRef.current) {
      try { recognitionRef.current.stop() } catch {}
    }
    setIsRecording(false)
  }

  const cancelRecording = () => {
    retryCountRef.current = 99
    if (recognitionRef.current) {
      try { recognitionRef.current.stop() } catch {}
    }
    setIsRecording(false)
    setTranscript('')
  }

  const sendTranscript = (text) => {
    if (text.trim()) onTranscript(text.trim())
    setTranscript('')
  }

  const formatTime = (s) => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`

  return {
    isRecording, transcript, setTranscript,
    timer: formatTime(timer),
    startRecording, stopRecording, cancelRecording, sendTranscript,
  }
}
