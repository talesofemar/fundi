import { MessageCircle, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { DEMO_AI_LABEL, demoAssistantReply } from '../lib/demoAi'
import { Button, Chip } from './ui'

const PROMPTS = [
  'Help me prepare a quotation for a three-door wardrobe.',
  'Turn this customer message into an order.',
  'What details should I ask before accepting this building job?',
  'Translate this Luganda message into English.',
  'Help me write a polite message explaining that delivery will be delayed.',
  'Turn these project notes into a portfolio description.',
]

export function AskFundi() {
  const [open, setOpen] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [reply, setReply] = useState<{ reply: string; actions: string[] } | null>(null)
  const location = useLocation()
  const navigate = useNavigate()

  const context = useMemo(() => {
    const p = location.pathname
    if (p.includes('quote')) return 'Quotation builder'
    if (p.includes('voice')) return 'Voice Bridge'
    if (p.includes('work') || p.includes('orders')) return 'Orders'
    if (p.includes('portfolio')) return 'Portfolio'
    if (p.includes('explore') || p.includes('worker/')) return 'Marketplace'
    if (p.includes('home')) return 'Worker home'
    return 'FUNDI'
  }, [location.pathname])

  async function ask(text: string) {
    setPrompt(text)
    setLoading(true)
    setReply(null)
    const res = await demoAssistantReply(text, context)
    setReply({ reply: res.reply, actions: res.actions })
    setLoading(false)
  }

  function runAction(action: string) {
    setOpen(false)
    if (action.toLowerCase().includes('voice')) navigate('/worker/voice')
    else if (action.toLowerCase().includes('order')) navigate('/worker/work?new=1')
    else if (action.toLowerCase().includes('portfolio')) navigate('/worker/portfolio/new')
    else if (action.toLowerCase().includes('quotation') || action.toLowerCase().includes('quote'))
      navigate('/worker/quote')
    else if (action.toLowerCase().includes('copy') && reply) {
      navigator.clipboard?.writeText(reply.reply)
    }
  }

  return (
    <>
      <button className="ask-fab" onClick={() => setOpen(true)} aria-label="Ask FUNDI">
        <MessageCircle size={22} />
        <span>Ask FUNDI</span>
      </button>
      {open ? (
        <div className="ask-panel">
          <div className="ask-head">
            <div>
              <strong>Ask FUNDI</strong>
              <p>Context: {context}</p>
            </div>
            <button className="icon-btn" onClick={() => setOpen(false)} aria-label="Close">
              <X size={18} />
            </button>
          </div>
          <Chip tone="accent">{DEMO_AI_LABEL}</Chip>
          <div className="ask-prompts">
            {PROMPTS.map((p) => (
              <button key={p} className="ask-chip" onClick={() => ask(p)}>
                {p}
              </button>
            ))}
          </div>
          <textarea
            className="input textarea"
            rows={3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Type your question…"
          />
          <Button onClick={() => ask(prompt)} disabled={!prompt.trim() || loading}>
            {loading ? 'Thinking…' : 'Ask'}
          </Button>
          {reply ? (
            <div className="ask-reply">
              <p>{reply.reply}</p>
              <div className="row-wrap">
                {reply.actions.map((a) => (
                  <Button key={a} size="sm" variant="secondary" onClick={() => runAction(a)}>
                    {a}
                  </Button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  )
}
