import { Mic, Square, Upload } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { DEMO_AI_LABEL, SAMPLE_VOICE_DEMO, demoTranslate } from '../../lib/demoAi'
import { Button, Card, Chip, Field, PageHeader, Textarea, Toast } from '../../components/ui'

export function VoiceBridge() {
  const { currentUser, addVoice, addOrder } = useApp()
  const navigate = useNavigate()
  const [direction, setDirection] = useState<'lg-en' | 'en-lg'>('lg-en')
  const [recording, setRecording] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [transcript, setTranscript] = useState('')
  const [translation, setTranslation] = useState('')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const mediaRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current)
      if (audioUrl) URL.revokeObjectURL(audioUrl)
    }
  }, [audioUrl])

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const rec = new MediaRecorder(stream)
      chunksRef.current = []
      rec.ondataavailable = (e) => chunksRef.current.push(e.data)
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const url = URL.createObjectURL(blob)
        setAudioUrl(url)
        stream.getTracks().forEach((t) => t.stop())
      }
      mediaRef.current = rec
      rec.start()
      setRecording(true)
      setSeconds(0)
      timerRef.current = window.setInterval(() => setSeconds((s) => s + 1), 1000)
    } catch {
      setToast('Microphone permission denied. Type or paste text instead.')
      setTimeout(() => setToast(null), 3000)
    }
  }

  function stopRecording() {
    mediaRef.current?.stop()
    setRecording(false)
    if (timerRef.current) window.clearInterval(timerRef.current)
    setToast('Audio kept only for this session. Transcription uses Demo AI text fallback.')
    setTimeout(() => setToast(null), 3500)
  }

  function onUpload(file: File | null) {
    if (!file) return
    const url = URL.createObjectURL(file)
    setAudioUrl(url)
    setToast('Audio uploaded for this session only. Use text fallback for Demo AI translation.')
    setTimeout(() => setToast(null), 3500)
  }

  async function translate() {
    if (!transcript.trim()) {
      setToast('Enter or paste text to translate')
      setTimeout(() => setToast(null), 2000)
      return
    }
    setLoading(true)
    const res = await demoTranslate(transcript, direction)
    setTranscript(res.transcript)
    setTranslation(res.translation)
    addVoice({
      userId: currentUser?.id ?? 'demo',
      sourceLanguage: direction === 'lg-en' ? 'Luganda' : 'English',
      targetLanguage: direction === 'lg-en' ? 'English' : 'Luganda',
      transcript: res.transcript,
      translation: res.translation,
    })
    setLoading(false)
  }

  function loadSample() {
    setDirection('lg-en')
    setTranscript(SAMPLE_VOICE_DEMO.luganda)
    setTranslation('')
    setToast('Sample Luganda text loaded — not a live transcription')
    setTimeout(() => setToast(null), 2500)
  }

  function clearAll() {
    setTranscript('')
    setTranslation('')
    setAudioUrl(null)
    setSeconds(0)
  }

  function turnIntoOrder() {
    const text = translation || transcript
    if (!text.trim()) return
    if (!confirm('Create an order draft from this translation? You will confirm details next.')) return
    addOrder({
      workerId: currentUser!.id,
      customerName: '',
      title: 'Order from Voice Bridge',
      description: text,
      quantity: '',
      deadline: '',
      quotedAmount: 0,
      status: 'New',
      paymentStatus: 'Not paid',
      location: '',
      notes: 'Created from Voice Bridge — complete customer details',
    })
    navigate('/worker/work')
  }

  return (
    <div className="stack">
      <PageHeader
        title="FUNDI Voice Bridge"
        subtitle="Speak naturally. Understand clearly."
      />

      <Chip tone="accent">{DEMO_AI_LABEL}</Chip>
      <p className="muted">
        Audio transcription for Luganda is not available in this demo. Record/upload for practice, then
        type or paste text to translate. Draft translations are editable — not perfect.
      </p>

      <div className="mode-toggle">
        <button
          className={direction === 'lg-en' ? 'mode active' : 'mode'}
          onClick={() => setDirection('lg-en')}
        >
          Luganda → English
        </button>
        <button
          className={direction === 'en-lg' ? 'mode active' : 'mode'}
          onClick={() => setDirection('en-lg')}
        >
          English → Luganda
        </button>
      </div>

      <Card className="stack">
        <div className="row-wrap">
          {!recording ? (
            <Button onClick={startRecording}>
              <Mic size={16} /> Record audio
            </Button>
          ) : (
            <Button variant="danger" onClick={stopRecording}>
              <Square size={16} /> Stop ({seconds}s)
            </Button>
          )}
          <label className="btn btn-secondary btn-md">
            <Upload size={16} /> Upload audio
            <input
              type="file"
              accept="audio/*"
              hidden
              onChange={(e) => onUpload(e.target.files?.[0] ?? null)}
            />
          </label>
          <Button variant="ghost" onClick={loadSample}>
            Load sample text
          </Button>
        </div>
        {audioUrl ? <audio controls src={audioUrl} className="audio-player" /> : null}
      </Card>

      <div className="grid-2">
        <Field
          label={
            direction === 'lg-en' ? 'Original Luganda transcript' : 'Original English transcript'
          }
        >
          <Textarea
            rows={5}
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Type or paste text here…"
          />
        </Field>
        <Field
          label={
            direction === 'lg-en'
              ? 'English translation (draft — editable)'
              : 'Luganda translation (draft — editable)'
          }
        >
          <Textarea
            rows={5}
            value={translation}
            onChange={(e) => setTranslation(e.target.value)}
            placeholder="Translation appears here…"
          />
        </Field>
      </div>

      <div className="row-wrap">
        <Button onClick={translate} disabled={loading}>
          {loading ? 'Translating…' : 'Transcribe / Translate'}
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            navigator.clipboard?.writeText(translation)
            setToast('Translation copied')
            setTimeout(() => setToast(null), 1500)
          }}
          disabled={!translation}
        >
          Copy translation
        </Button>
        <Button variant="secondary" onClick={turnIntoOrder} disabled={!translation && !transcript}>
          Turn this message into an order
        </Button>
        <Button variant="ghost" onClick={clearAll}>
          Clear
        </Button>
      </div>
      <Toast message={toast} />
    </div>
  )
}
