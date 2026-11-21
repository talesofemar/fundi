import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { TRADES } from '../../data/seed'
import { DEMO_AI_LABEL, demoPortfolioCopy } from '../../lib/demoAi'
import { formatDate, formatUGX, todayISO } from '../../lib/format'
import {
  Avatar,
  Button,
  Card,
  Chip,
  Empty,
  Field,
  Input,
  PageHeader,
  Select,
  Textarea,
  Toast,
  statusTone,
} from '../../components/ui'

export function DiscoverJobs() {
  const { state } = useApp()
  const open = state.enquiries.filter((e) => e.status === 'New')
  return (
    <div className="stack">
      <PageHeader
        title="Discover jobs"
        subtitle="Open enquiries in the demo marketplace"
      />
      {open.length === 0 ? (
        <Empty title="No open jobs right now" body="When customers send requests, they appear here." />
      ) : (
        open.map((e) => (
          <Card key={e.id}>
            <div className="row-between">
              <strong>{e.customerName}</strong>
              <Chip tone="new">{e.reference}</Chip>
            </div>
            <p>{e.description}</p>
            <p className="muted">
              {e.location} · Preferred {formatDate(e.preferredDate)}
            </p>
          </Card>
        ))
      )}
    </div>
  )
}

export function PromisesPage() {
  const { state, currentUser, addPromise, updatePromise } = useApp()
  const [action, setAction] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [dueAt, setDueAt] = useState(todayISO())
  const [sourceText, setSourceText] = useState('')
  const [orderId, setOrderId] = useState('')
  const [toast, setToast] = useState<string | null>(null)

  const list = state.promises.filter((p) => p.workerId === currentUser?.id)
  const orders = state.orders.filter((o) => o.workerId === currentUser?.id)

  function save() {
    if (!action.trim() || !customerName.trim()) {
      setToast('Action and customer are required')
      setTimeout(() => setToast(null), 2000)
      return
    }
    if (!confirm('Save this promise?')) return
    addPromise({
      workerId: currentUser!.id,
      customerName,
      orderId: orderId || undefined,
      action,
      dueAt,
      sourceText,
    })
    setAction('')
    setSourceText('')
    setToast('Promise saved')
    setTimeout(() => setToast(null), 1500)
  }

  function extractPromise() {
    const text = sourceText.toLowerCase()
    if (text.includes('deliver')) setAction(sourceText.trim())
    else setAction(sourceText.trim() || 'Follow up with customer')
    if (text.includes('friday')) {
      setToast('“Friday” is ambiguous — pick the exact calendar date below')
      setTimeout(() => setToast(null), 3000)
    }
  }

  return (
    <div className="stack">
      <PageHeader title="FUNDI Promise" subtitle="Track what you told customers" />
      <Card className="stack">
        <p className="ai-note">{DEMO_AI_LABEL}</p>
        <Field label="Paste a message (optional)">
          <Textarea rows={2} value={sourceText} onChange={(e) => setSourceText(e.target.value)} />
        </Field>
        <Button variant="secondary" size="sm" onClick={extractPromise} disabled={!sourceText.trim()}>
          Extract promise with Demo AI
        </Button>
        <Field label="Promise / action">
          <Input value={action} onChange={(e) => setAction(e.target.value)} placeholder="Deliver two desks" />
        </Field>
        <Field label="Customer">
          <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
        </Field>
        <Field label="Linked order (optional)">
          <Select value={orderId} onChange={(e) => setOrderId(e.target.value)}>
            <option value="">None</option>
            {orders.map((o) => (
              <option key={o.id} value={o.id}>
                {o.title} — {o.customerName}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Due date">
          <Input type="date" value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
        </Field>
        <Button onClick={save}>Save promise</Button>
      </Card>
      <div className="stack-sm">
        {list.map((p) => (
          <Card key={p.id}>
            <div className="row-between">
              <strong>{p.action}</strong>
              <Chip tone={statusTone(p.status)}>{p.status}</Chip>
            </div>
            <p className="muted">
              {p.customerName} · {formatDate(p.dueAt)}
            </p>
            {p.status !== 'Completed' ? (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => updatePromise(p.id, { status: 'Completed' })}
              >
                Mark complete
              </Button>
            ) : null}
          </Card>
        ))}
      </div>
      <Toast message={toast} />
    </div>
  )
}

export function PortfolioNew() {
  const { currentUser, addPortfolio } = useApp()
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [notes, setNotes] = useState('')
  const [category, setCategory] = useState(currentUser?.trade ?? 'Carpenter')
  const [area, setArea] = useState(currentUser?.district ?? '')
  const [date, setDate] = useState(todayISO())
  const [testimonial, setTestimonial] = useState('')
  const [approved, setApproved] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function improve() {
    setLoading(true)
    const res = await demoPortfolioCopy(notes || description)
    setTitle(res.title)
    setDescription(res.description)
    setLoading(false)
    setToast('Demo AI draft ready — review before saving')
    setTimeout(() => setToast(null), 2500)
  }

  function save() {
    if (!title.trim() || !description.trim()) {
      setToast('Title and description required')
      setTimeout(() => setToast(null), 2000)
      return
    }
    if (!confirm('Add this project to your portfolio?')) return
    addPortfolio({
      workerId: currentUser!.id,
      title,
      description,
      category,
      imageUrls: [
        `https://placehold.co/600x400/1B3A4B/F4F1EC?text=${encodeURIComponent(title.slice(0, 12))}`,
      ],
      completionDate: date,
      publicVisibility: true,
      testimonialText: testimonial || undefined,
      testimonialApproved: approved && !!testimonial,
      area,
      servicesPerformed: [category],
    })
    navigate(`/profile/${currentUser!.id}`)
  }

  return (
    <div className="stack">
      <PageHeader title="Add completed work" subtitle="Show your craft on your public profile" />
      <Card className="stack">
        <p className="ai-note">{DEMO_AI_LABEL}</p>
        <Field label="Rough notes">
          <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
        <Button variant="secondary" onClick={improve} disabled={loading}>
          {loading ? 'Improving…' : 'Improve description'}
        </Button>
        <Field label="Project title">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>
        <Field label="Description">
          <Textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>
        <Field label="Category">
          <Select value={category} onChange={(e) => setCategory(e.target.value)}>
            {TRADES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </Select>
        </Field>
        <div className="grid-2">
          <Field label="Completion date">
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Area">
            <Input value={area} onChange={(e) => setArea(e.target.value)} />
          </Field>
        </div>
        <Field label="Customer-approved testimonial (optional)">
          <Textarea rows={2} value={testimonial} onChange={(e) => setTestimonial(e.target.value)} />
        </Field>
        <label className="check">
          <input type="checkbox" checked={approved} onChange={(e) => setApproved(e.target.checked)} />
          Customer approved this testimonial
        </label>
        <Button onClick={save}>Save to portfolio</Button>
      </Card>
      <Toast message={toast} />
    </div>
  )
}

export function WorkerProfilePage() {
  const { currentUser, updateProfile, setRole, resetDemo } = useApp()
  const navigate = useNavigate()
  if (!currentUser) return null

  return (
    <div className="stack">
      <PageHeader title="Profile" subtitle="Control what customers can see" />
      <Card className="row gap">
        <Avatar name={currentUser.businessName || currentUser.fullName} />
        <div>
          <strong>{currentUser.businessName || currentUser.fullName}</strong>
          <p className="muted">
            {currentUser.trade} · {currentUser.town}, {currentUser.district}
          </p>
        </div>
      </Card>
      <Field label="Business / full name">
        <Input
          value={currentUser.businessName || currentUser.fullName}
          onChange={(e) => updateProfile({ businessName: e.target.value })}
        />
      </Field>
      <Field label="Trade">
        <Select value={currentUser.trade} onChange={(e) => updateProfile({ trade: e.target.value })}>
          {TRADES.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </Select>
      </Field>
      <Field label="Short description">
        <Textarea
          rows={3}
          value={currentUser.bio}
          onChange={(e) => updateProfile({ bio: e.target.value })}
        />
      </Field>
      <Field label="Phone (private by default — not shown publicly)">
        <Input value={currentUser.phone} onChange={(e) => updateProfile({ phone: e.target.value })} />
      </Field>
      <Field label="Availability">
        <Select
          value={currentUser.availability}
          onChange={(e) =>
            updateProfile({
              availability: e.target.value as typeof currentUser.availability,
            })
          }
        >
          <option>Available for new work</option>
          <option>Busy</option>
          <option>Not taking work</option>
        </Select>
      </Field>
      <label className="check">
        <input
          type="checkbox"
          checked={currentUser.publicProfileEnabled}
          onChange={(e) => updateProfile({ publicProfileEnabled: e.target.checked })}
        />
        Show my profile in FUNDI Discover
      </label>
      <p className="muted">
        Customers see your name, trade, area, about, services, and portfolio — not your phone unless you
        choose to share it in a message.
      </p>
      <div className="row-wrap">
        <Button variant="secondary" onClick={() => navigate(`/profile/${currentUser.id}`)}>
          Preview public profile
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            setRole('customer')
            navigate('/customer/explore')
          }}
        >
          Switch to customer mode
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            if (confirm('Reset all demo data?')) {
              resetDemo()
              navigate('/')
            }
          }}
        >
          Reset demo data
        </Button>
      </div>
    </div>
  )
}

export function InsightsPage() {
  const { state, currentUser } = useApp()
  const workerId = currentUser?.id ?? ''
  const orders = state.orders.filter((o) => o.workerId === workerId)
  const quotes = state.quotations.filter((q) => q.workerId === workerId)
  const expenses = state.expenses.filter((e) => e.workerId === workerId)
  const earned = orders
    .filter((o) => o.paymentStatus === 'Paid' || o.paymentStatus === 'Deposit paid')
    .reduce((s, o) => s + o.quotedAmount, 0)
  const expenseTotal = expenses.reduce((s, e) => s + e.amount, 0)

  return (
    <div className="stack">
      <PageHeader title="Business insights" subtitle="Simple demo numbers from your local data" />
      <div className="stat-grid">
        <Card>
          <span className="stat-label">Orders</span>
          <strong className="stat-value">{orders.length}</strong>
        </Card>
        <Card>
          <span className="stat-label">Quotations</span>
          <strong className="stat-value">{quotes.length}</strong>
        </Card>
        <Card>
          <span className="stat-label">Marked received</span>
          <strong className="stat-value">{formatUGX(earned)}</strong>
        </Card>
        <Card>
          <span className="stat-label">Expenses logged</span>
          <strong className="stat-value">{formatUGX(expenseTotal)}</strong>
        </Card>
      </div>
      <Card>
        <p className="muted">
          These figures come from demo/local data you entered. They are not bank or mobile-money balances.
        </p>
      </Card>
    </div>
  )
}

export function ExpensesPage() {
  const { state, currentUser, addExpense, deleteExpense } = useApp()
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('Materials')
  const list = state.expenses.filter((e) => e.workerId === currentUser?.id)

  return (
    <div className="stack">
      <PageHeader title="Expenses" subtitle="Track material and job costs (extra feature)" />
      <Card className="stack">
        <Field label="Title">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>
        <div className="grid-2">
          <Field label="Amount (UGX)">
            <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </Field>
          <Field label="Category">
            <Select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option>Materials</option>
              <option>Transport</option>
              <option>Tools</option>
              <option>Other</option>
            </Select>
          </Field>
        </div>
        <Button
          onClick={() => {
            if (!title || !amount) return
            addExpense({
              workerId: currentUser!.id,
              title,
              category,
              amount: Number(amount),
              date: todayISO(),
              notes: '',
            })
            setTitle('')
            setAmount('')
          }}
        >
          Add expense
        </Button>
      </Card>
      {list.map((e) => (
        <Card key={e.id} className="row-between">
          <div>
            <strong>{e.title}</strong>
            <p className="muted">
              {e.category} · {formatDate(e.date)}
            </p>
          </div>
          <div className="row gap">
            <span>{formatUGX(e.amount)}</span>
            <Button size="sm" variant="ghost" onClick={() => deleteExpense(e.id)}>
              Delete
            </Button>
          </div>
        </Card>
      ))}
    </div>
  )
}

export function EnquiryDetail() {
  const { state, updateEnquiry } = useApp()
  const navigate = useNavigate()
  const { id } = useParams()
  const enquiry = state.enquiries.find((e) => e.id === id)
  if (!enquiry) return <Empty title="Enquiry not found" />

  return (
    <div className="stack">
      <PageHeader title={enquiry.customerName} subtitle={enquiry.reference} />
      <Card className="stack">
        <Chip tone={statusTone(enquiry.status)}>{enquiry.status}</Chip>
        <p>{enquiry.description}</p>
        <p className="muted">
          {enquiry.location} · Preferred {formatDate(enquiry.preferredDate)}
        </p>
      </Card>
      <div className="row-wrap">
        <Button
          onClick={() => {
            updateEnquiry(enquiry.id, { status: 'Quoted' })
            navigate('/worker/quote')
          }}
        >
          Create quotation
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            if (confirm('Mark this enquiry as accepted?'))
              updateEnquiry(enquiry.id, { status: 'Accepted' })
          }}
        >
          Mark accepted
        </Button>
      </div>
    </div>
  )
}
