import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { formatDate } from '../../lib/format'
import { VoiceBridge } from '../worker/Voice'
import {
  Avatar,
  Button,
  Card,
  Chip,
  Empty,
  Field,
  Input,
  PageHeader,
  Textarea,
  Toast,
  statusTone,
} from '../../components/ui'

export function WorkerPublicProfile() {
  const { id } = useParams()
  const { getWorker, state, toggleSaved, isSaved, role } = useApp()
  const navigate = useNavigate()
  const worker = getWorker(id ?? '')
  if (!worker || !worker.publicProfileEnabled) {
    return (
      <Empty
        title="Profile not available"
        action={
          <Button onClick={() => navigate(role === 'worker' ? '/worker/home' : '/customer/explore')}>
            Back
          </Button>
        }
      />
    )
  }
  const projects = state.portfolio.filter((p) => p.workerId === worker.id && p.publicVisibility)
  const saved = isSaved(worker.id)

  return (
    <div className="stack" style={{ padding: '1rem', maxWidth: 920, margin: '0 auto' }}>
      <Card className="row gap">
        <Avatar name={worker.businessName || worker.fullName} />
        <div className="grow">
          <h1 className="profile-name">{worker.businessName || worker.fullName}</h1>
          <p className="muted">
            {worker.trade} · {worker.serviceAreas.join(', ')}
          </p>
          <Chip tone={worker.availability === 'Available for new work' ? 'success' : 'warn'}>
            {worker.availability}
          </Chip>
        </div>
      </Card>
      <Card>
        <h2>About</h2>
        <p>{worker.bio}</p>
        {worker.priceGuidance ? (
          <p className="muted">Price guidance (worker-provided): {worker.priceGuidance}</p>
        ) : null}
      </Card>
      <Card>
        <h2>Services</h2>
        <div className="row-wrap">
          {worker.services.map((s) => (
            <Chip key={s}>{s}</Chip>
          ))}
        </div>
      </Card>
      <h2>Portfolio</h2>
      {projects.length === 0 ? (
        <Empty title="No public projects yet" />
      ) : (
        projects.map((p) => (
          <Card key={p.id}>
            <div className="thumb-row lg">
              {p.imageUrls.map((src) => (
                <img key={src} src={src} alt={p.title} />
              ))}
            </div>
            <strong>{p.title}</strong>
            <p>{p.description}</p>
            <p className="muted">
              {p.category} · {formatDate(p.completionDate)}
              {p.area ? ` · ${p.area}` : ''}
            </p>
            {p.testimonialApproved && p.testimonialText ? (
              <blockquote className="testimonial">
                “{p.testimonialText}”
                <footer>Customer-approved testimonial</footer>
              </blockquote>
            ) : null}
          </Card>
        ))
      )}
      <div className="row-wrap sticky-actions">
        {role === 'customer' ? (
          <>
            <Button variant="accent" onClick={() => navigate(`/customer/request/${worker.id}`)}>
              Request a quote
            </Button>
            <Button variant="secondary" onClick={() => toggleSaved(worker.id)}>
              {saved ? 'Remove from saved' : 'Save worker'}
            </Button>
          </>
        ) : (
          <Chip tone="accent">Public preview</Chip>
        )}
        <Button
          variant="ghost"
          onClick={() => navigate(role === 'worker' ? '/worker/home' : '/customer/explore')}
        >
          Back
        </Button>
      </div>
    </div>
  )
}

export function RequestQuote() {
  const { id } = useParams()
  const { getWorker, addEnquiry, currentUser } = useApp()
  const navigate = useNavigate()
  const worker = getWorker(id ?? '')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState(currentUser?.town ?? '')
  const [preferredDate, setPreferredDate] = useState('')
  const [done, setDone] = useState<{ reference: string } | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  if (!worker) return <Empty title="Worker not found" />

  function submit() {
    if (!description.trim()) {
      setToast('Please describe the job')
      setTimeout(() => setToast(null), 2000)
      return
    }
    if (!confirm('Send this request to the worker?')) return
    const enq = addEnquiry({
      customerId: currentUser?.id ?? 'cust_demo_sarah',
      customerName: currentUser?.fullName ?? 'Sarah Nakato',
      workerId: worker!.id,
      description: description.trim(),
      location,
      preferredDate,
      imageUrls: [],
    })
    setDone({ reference: enq.reference })
  }

  if (done) {
    return (
      <div className="stack">
        <PageHeader title="Request sent" subtitle="Confirmation" />
        <Card className="stack center">
          <Chip tone="success">Success</Chip>
          <h2>Reference {done.reference}</h2>
          <p>
            Your request was saved for <strong>{worker.businessName || worker.fullName}</strong>. They
            will see it in their worker inbox. No WhatsApp message was sent.
          </p>
          <Button onClick={() => navigate('/customer/requests')}>View my requests</Button>
          <Button variant="ghost" onClick={() => navigate('/customer/explore')}>
            Back to explore
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="stack">
      <PageHeader
        title="Request a quote"
        subtitle={`To ${worker.businessName || worker.fullName}`}
      />
      <Field label="Job description">
        <Textarea
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="I need a three-door wardrobe with drawers. Please let me know the price and how long it will take."
        />
      </Field>
      <Field label="Location">
        <Input value={location} onChange={(e) => setLocation(e.target.value)} />
      </Field>
      <Field label="Preferred timeframe">
        <Input type="date" value={preferredDate} onChange={(e) => setPreferredDate(e.target.value)} />
      </Field>
      <Button onClick={submit}>Submit request</Button>
      <Toast message={toast} />
    </div>
  )
}

export function SavedWorkers() {
  const { state, isSaved, getWorker, toggleSaved } = useApp()
  const navigate = useNavigate()
  const saved = state.workers.filter((w) => isSaved(w.id))

  return (
    <div className="stack">
      <PageHeader
        title="Saved"
        subtitle="Your shortlist"
        action={
          <Button size="sm" variant="secondary" onClick={() => navigate('/customer/compare')}>
            Compare
          </Button>
        }
      />
      {saved.length === 0 ? (
        <Empty
          title="No saved workers"
          body="Save people from Explore to compare them later."
          action={<Button onClick={() => navigate('/customer/explore')}>Explore</Button>}
        />
      ) : (
        saved.map((w) => (
          <Card key={w.id} className="row-between">
            <div className="row gap">
              <Avatar name={w.businessName || w.fullName} />
              <div>
                <strong>{w.businessName || w.fullName}</strong>
                <p className="muted">
                  {w.trade} · {w.district}
                </p>
              </div>
            </div>
            <div className="row-wrap">
              <Button size="sm" onClick={() => navigate(`/customer/worker/${w.id}`)}>
                View
              </Button>
              <Button size="sm" variant="ghost" onClick={() => toggleSaved(w.id)}>
                Remove
              </Button>
            </div>
          </Card>
        ))
      )}
    </div>
  )
}

export function ComparePage() {
  const { state, isSaved } = useApp()
  const saved = state.workers.filter((w) => isSaved(w.id)).slice(0, 3)
  return (
    <div className="stack">
      <PageHeader title="Compare" subtitle="Side-by-side shortlist (no fake ratings)" />
      {saved.length < 2 ? (
        <Empty title="Save at least two workers" body="Then return here to compare." />
      ) : (
        <div className="compare-grid">
          {saved.map((w) => {
            const ports = state.portfolio.filter((p) => p.workerId === w.id)
            return (
              <Card key={w.id}>
                <strong>{w.businessName || w.fullName}</strong>
                <p>{w.trade}</p>
                <p className="muted">{w.serviceAreas.join(', ')}</p>
                <Chip>{w.availability}</Chip>
                <p>{ports.length} portfolio project(s)</p>
                <p className="muted">{w.priceGuidance || 'No price guidance provided'}</p>
                <div className="thumb-row">
                  {ports.slice(0, 2).map((p) => (
                    <img key={p.id} src={p.imageUrls[0]} alt={p.title} />
                  ))}
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function MyRequests() {
  const { state, currentUser } = useApp()
  const list = state.enquiries.filter((e) => e.customerId === currentUser?.id)
  const navigate = useNavigate()
  return (
    <div className="stack">
      <PageHeader title="My requests" subtitle="Quotes you asked for" />
      {list.length === 0 ? (
        <Empty
          title="No requests yet"
          action={<Button onClick={() => navigate('/customer/explore')}>Find a worker</Button>}
        />
      ) : (
        list.map((e) => {
          const worker = state.workers.find((w) => w.id === e.workerId)
          return (
            <Card key={e.id}>
              <div className="row-between">
                <strong>{e.reference}</strong>
                <Chip tone={statusTone(e.status)}>{e.status}</Chip>
              </div>
              <p>{worker?.businessName || worker?.fullName}</p>
              <p className="clamp-2">{e.description}</p>
              <p className="muted">{formatDate(e.createdAt)}</p>
            </Card>
          )
        })
      )}
    </div>
  )
}

export function MessagesPage() {
  const { state, role, addMessage } = useApp()
  const [active, setActive] = useState<string | null>(null)
  const [text, setText] = useState('')
  const threads = state.messages.filter((m) =>
    role === 'worker' ? m.roleSide === 'worker' : m.roleSide === 'customer',
  )
  const thread = threads.find((t) => t.id === active) ?? threads[0]

  const templates = [
    'Thank you — I will prepare a quotation shortly.',
    'Please share the measurements when you can.',
    'Delivery will be delayed by two days. Sorry for the inconvenience.',
  ]

  return (
    <div className="stack">
      <PageHeader title="Messages" subtitle="In-app demo inbox + reply templates" />
      {threads.length === 0 ? (
        <Empty title="No messages" />
      ) : (
        <>
          <div className="tabs">
            {threads.map((t) => (
              <button
                key={t.id}
                className={thread?.id === t.id ? 'tab active' : 'tab'}
                onClick={() => setActive(t.id)}
              >
                {t.participantName}
              </button>
            ))}
          </div>
          {thread ? (
            <Card className="stack">
              <strong>{thread.participantName}</strong>
              <div className="chat">
                {thread.messages.map((m) => (
                  <div key={m.id} className={m.from === 'me' ? 'bubble me' : 'bubble'}>
                    {m.text}
                  </div>
                ))}
              </div>
              <div className="row-wrap">
                {templates.map((t) => (
                  <button key={t} className="ask-chip" onClick={() => setText(t)}>
                    {t}
                  </button>
                ))}
              </div>
              <Textarea rows={2} value={text} onChange={(e) => setText(e.target.value)} />
              <Button
                onClick={() => {
                  if (!text.trim()) return
                  addMessage(thread.id, text.trim())
                  setText('')
                }}
              >
                Send
              </Button>
            </Card>
          ) : null}
        </>
      )}
    </div>
  )
}

export function CustomerProfilePage() {
  const { currentUser, updateProfile, setRole, resetDemo } = useApp()
  const navigate = useNavigate()
  if (!currentUser) return null
  return (
    <div className="stack">
      <PageHeader title="Profile" subtitle="Customer account" />
      <Field label="Full name">
        <Input
          value={currentUser.fullName}
          onChange={(e) => updateProfile({ fullName: e.target.value })}
        />
      </Field>
      <Field label="Town / district">
        <Input
          value={`${currentUser.town}, ${currentUser.district}`}
          onChange={(e) => {
            const [town, district] = e.target.value.split(',').map((x) => x.trim())
            updateProfile({ town: town || e.target.value, district: district || currentUser.district })
          }}
        />
      </Field>
      <Field label="Phone (private)">
        <Input value={currentUser.phone} onChange={(e) => updateProfile({ phone: e.target.value })} />
      </Field>
      <Button
        variant="secondary"
        onClick={() => {
          setRole('worker')
          navigate('/worker/home')
        }}
      >
        Switch to service provider mode
      </Button>
      <Button variant="secondary" onClick={() => navigate('/customer/voice')}>
        Open Voice Bridge
      </Button>
      <Button
        variant="ghost"
        onClick={() => {
          if (confirm('Reset demo data?')) {
            resetDemo()
            navigate('/')
          }
        }}
      >
        Reset demo data
      </Button>
    </div>
  )
}

export function CustomerVoice() {
  return <VoiceBridge />
}
