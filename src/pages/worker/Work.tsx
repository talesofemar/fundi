import { useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { demoExtractOrder, DEMO_AI_LABEL } from '../../lib/demoAi'
import { formatDate, formatUGX } from '../../lib/format'
import type { JobStatus, PaymentStatus } from '../../types'
import {
  Button,
  Card,
  Chip,
  Empty,
  Field,
  Input,
  Modal,
  PageHeader,
  Select,
  Textarea,
  Toast,
  statusTone,
} from '../../components/ui'

const FILTERS: Array<'All' | JobStatus> = [
  'All',
  'New',
  'Quoted',
  'In progress',
  'Completed',
  'Awaiting payment',
]

export function WorkerWork() {
  const { state, currentUser, addOrder } = useApp()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('All')
  const [toast, setToast] = useState<string | null>(null)
  const showNew = params.get('new') === '1'

  const orders = useMemo(() => {
    const list = state.orders.filter((o) => o.workerId === currentUser?.id)
    if (filter === 'All') return list
    return list.filter((o) => o.status === filter)
  }, [state.orders, currentUser?.id, filter])

  const [form, setForm] = useState({
    paste: '',
    customerName: '',
    title: '',
    description: '',
    quantity: '',
    deadline: '',
    location: '',
    quotedAmount: '',
    notes: '',
    missing: [] as string[],
  })
  const [extracting, setExtracting] = useState(false)

  async function extract() {
    setExtracting(true)
    const res = await demoExtractOrder(form.paste)
    setForm((f) => ({
      ...f,
      customerName: res.customerName || f.customerName,
      title: res.title,
      description: res.description,
      quantity: res.quantity,
      deadline: res.deadline.includes('confirm') ? '' : f.deadline,
      location: res.location,
      notes: res.budget ? `Budget mentioned: ${res.budget}` : f.notes,
      missing: res.missing,
    }))
    setExtracting(false)
    setToast('Demo AI extracted fields — review before saving')
    setTimeout(() => setToast(null), 2500)
  }

  function saveOrder() {
    if (!form.customerName.trim() || !form.title.trim()) {
      setToast('Customer name and job title are required')
      setTimeout(() => setToast(null), 2000)
      return
    }
    if (!confirm('Save this order?')) return
    addOrder({
      workerId: currentUser!.id,
      customerName: form.customerName.trim(),
      title: form.title.trim(),
      description: form.description.trim(),
      quantity: form.quantity,
      deadline: form.deadline,
      quotedAmount: Number(form.quotedAmount) || 0,
      status: 'New',
      paymentStatus: 'Not paid',
      location: form.location,
      notes: form.notes,
    })
    setParams({})
    setForm({
      paste: '',
      customerName: '',
      title: '',
      description: '',
      quantity: '',
      deadline: '',
      location: '',
      quotedAmount: '',
      notes: '',
      missing: [],
    })
    setToast('Order saved')
    setTimeout(() => setToast(null), 2000)
  }

  return (
    <div className="stack">
      <PageHeader
        title="My work"
        subtitle="Orders, status, and payments"
        action={
          <Button onClick={() => setParams({ new: '1' })}>Add order</Button>
        }
      />

      <div className="tabs">
        {FILTERS.map((f) => (
          <button key={f} className={filter === f ? 'tab active' : 'tab'} onClick={() => setFilter(f)}>
            {f}
          </button>
        ))}
      </div>

      {orders.length === 0 ? (
        <Empty title="No orders here" body="Create an order or convert an accepted quotation." />
      ) : (
        <div className="stack-sm">
          {orders.map((o) => (
            <Card key={o.id} onClick={() => navigate(`/worker/order/${o.id}`)}>
              <div className="row-between">
                <strong>{o.title}</strong>
                <Chip tone={statusTone(o.status)}>{o.status}</Chip>
              </div>
              <p className="muted">
                {o.customerName} · Due {formatDate(o.deadline)}
              </p>
              <div className="row-between">
                <span>{o.quotedAmount ? formatUGX(o.quotedAmount) : 'Amount TBD'}</span>
                <Chip tone={statusTone(o.paymentStatus)}>{o.paymentStatus}</Chip>
              </div>
            </Card>
          ))}
        </div>
      )}

      <div className="row-wrap">
        <Button variant="secondary" onClick={() => navigate('/worker/promises')}>
          Promise tracker
        </Button>
        <Button variant="secondary" onClick={() => navigate('/worker/quote')}>
          New quotation
        </Button>
      </div>

      <Modal open={showNew} title="New order" onClose={() => setParams({})}>
        <div className="stack">
          <p className="ai-note">{DEMO_AI_LABEL}</p>
          <Field label="Paste customer message (optional)">
            <Textarea
              rows={3}
              value={form.paste}
              onChange={(e) => setForm({ ...form, paste: e.target.value })}
              placeholder="Paste WhatsApp/text message here…"
            />
          </Field>
          <Button variant="secondary" onClick={extract} disabled={!form.paste.trim() || extracting}>
            {extracting ? 'Extracting…' : 'Extract with Demo AI'}
          </Button>
          {form.missing.length > 0 ? (
            <Card>
              <strong>Missing details to confirm</strong>
              <ul>
                {form.missing.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            </Card>
          ) : null}
          <Field label="Customer name">
            <Input
              value={form.customerName}
              onChange={(e) => setForm({ ...form, customerName: e.target.value })}
            />
          </Field>
          <Field label="Job title">
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </Field>
          <Field label="Description">
            <Textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </Field>
          <div className="grid-2">
            <Field label="Quantity">
              <Input
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              />
            </Field>
            <Field label="Deadline">
              <Input
                type="date"
                value={form.deadline}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Location">
            <Input
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
          </Field>
          <Field label="Quoted amount (UGX)">
            <Input
              type="number"
              value={form.quotedAmount}
              onChange={(e) => setForm({ ...form, quotedAmount: e.target.value })}
            />
          </Field>
          <Button onClick={saveOrder}>Confirm & save order</Button>
        </div>
      </Modal>
      <Toast message={toast} />
    </div>
  )
}

export function OrderDetail() {
  const { state, updateOrder } = useApp()
  const navigate = useNavigate()
  const { id } = useParams()
  const order = state.orders.find((o) => o.id === id)

  if (!order) {
    return <Empty title="Order not found" action={<Button onClick={() => navigate('/worker/work')}>Back</Button>} />
  }

  return (
    <div className="stack">
      <PageHeader title={order.title} subtitle={order.customerName} />
      <Card>
        <div className="row-between">
          <Chip tone={statusTone(order.status)}>{order.status}</Chip>
          <Chip tone={statusTone(order.paymentStatus)}>{order.paymentStatus}</Chip>
        </div>
        <p>{order.description}</p>
        <p className="muted">
          {order.location} · Due {formatDate(order.deadline)} · {formatUGX(order.quotedAmount)}
        </p>
        {order.notes ? <p>Notes: {order.notes}</p> : null}
      </Card>

      <Field label="Update status">
        <Select
          value={order.status}
          onChange={(e) => {
            if (confirm(`Set status to ${e.target.value}?`))
              updateOrder(order.id, { status: e.target.value as JobStatus })
          }}
        >
          {['New', 'Quoted', 'Accepted', 'In progress', 'Completed', 'Awaiting payment', 'Declined'].map(
            (s) => (
              <option key={s}>{s}</option>
            ),
          )}
        </Select>
      </Field>

      <Field label="Payment status (manual — no live mobile money)">
        <Select
          value={order.paymentStatus}
          onChange={(e) => {
            if (confirm(`Set payment to ${e.target.value}?`))
              updateOrder(order.id, { paymentStatus: e.target.value as PaymentStatus })
          }}
        >
          {['Not paid', 'Deposit paid', 'Partially paid', 'Paid'].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </Select>
      </Field>

      <Card>
        <strong>Activity</strong>
        <ul className="activity">
          {order.activity.map((a, i) => (
            <li key={i}>
              <span className="muted">{formatDate(a.at)}</span> {a.text}
            </li>
          ))}
        </ul>
      </Card>

      <div className="row-wrap">
        <Button variant="secondary" onClick={() => navigate('/worker/quote')}>
          Create quotation
        </Button>
        <Button variant="secondary" onClick={() => navigate('/worker/promises')}>
          Add promise
        </Button>
        <Button variant="ghost" onClick={() => navigate('/worker/work')}>
          Back
        </Button>
      </div>
    </div>
  )
}

