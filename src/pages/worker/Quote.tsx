import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { jsPDF } from 'jspdf'
import { useApp } from '../../context/AppContext'
import { DEMO_AI_LABEL, demoQuoteHints } from '../../lib/demoAi'
import { formatUGX, uid } from '../../lib/format'
import type { LineItem, QuoteStatus } from '../../types'
import {
  Button,
  Card,
  Chip,
  Field,
  Input,
  PageHeader,
  Select,
  Textarea,
  Toast,
} from '../../components/ui'
import { TRADES } from '../../data/seed'

export function QuoteBuilder() {
  const { currentUser, addQuotation, updateQuotation, state } = useApp()
  const navigate = useNavigate()
  const [toast, setToast] = useState<string | null>(null)
  const [step, setStep] = useState(1)
  const [hints, setHints] = useState<Awaited<ReturnType<typeof demoQuoteHints>> | null>(null)
  const [loading, setLoading] = useState(false)

  const [trade, setTrade] = useState(currentUser?.trade ?? 'Carpenter')
  const [customerName, setCustomerName] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [materials, setMaterials] = useState(0)
  const [labour, setLabour] = useState(0)
  const [transport, setTransport] = useState(0)
  const [other, setOther] = useState(0)
  const [margin, setMargin] = useState(0)
  const [validUntil, setValidUntil] = useState('')
  const [expectedCompletion, setExpectedCompletion] = useState('')
  const [notes, setNotes] = useState('')
  const [exclusions, setExclusions] = useState('')
  const [savedId, setSavedId] = useState<string | null>(null)

  const lineItems: LineItem[] = useMemo(
    () =>
      [
        materials > 0 && { id: uid('li'), label: 'Materials', amount: materials, category: 'materials' as const },
        labour > 0 && { id: uid('li'), label: 'Labour', amount: labour, category: 'labour' as const },
        transport > 0 && { id: uid('li'), label: 'Transport', amount: transport, category: 'transport' as const },
        other > 0 && { id: uid('li'), label: 'Other', amount: other, category: 'other' as const },
        margin > 0 && { id: uid('li'), label: 'Margin / profit (editable suggestion)', amount: margin, category: 'other' as const },
      ].filter(Boolean) as LineItem[],
    [materials, labour, transport, other, margin],
  )

  const grandTotal = materials + labour + transport + other + margin

  async function runHints() {
    setLoading(true)
    const res = await demoQuoteHints(jobDescription)
    setHints(res)
    if (res.suggestedTrade) setTrade(res.suggestedTrade)
    setLoading(false)
    setStep(2)
  }

  function applySuggestedMargin() {
    const base = materials + labour + transport + other
    if (base <= 0) {
      setToast('Enter your costs first — AI does not invent prices')
      setTimeout(() => setToast(null), 2500)
      return
    }
    setMargin(Math.round(base * ((hints?.marginSuggestion ?? 10) / 100)))
  }

  function save(status: QuoteStatus) {
    if (!customerName.trim() || !jobDescription.trim()) {
      setToast('Customer name and job description are required')
      setTimeout(() => setToast(null), 2000)
      return
    }
    if (!confirm(`${status === 'Draft' ? 'Save draft' : 'Save and mark as ' + status}?`)) return
    const payload = {
      workerId: currentUser!.id,
      customerName: customerName.trim(),
      jobDescription: jobDescription.trim(),
      lineItems,
      materialsTotal: materials,
      labourTotal: labour,
      transportTotal: transport,
      otherTotal: other,
      marginAmount: margin,
      grandTotal,
      validUntil: validUntil || undefined,
      expectedCompletion: expectedCompletion || undefined,
      notes,
      exclusions,
      status,
    }
    if (savedId) {
      updateQuotation(savedId, payload)
    } else {
      const q = addQuotation(payload)
      setSavedId(q.id)
    }
    setToast(`Quotation ${status.toLowerCase()} saved`)
    setTimeout(() => setToast(null), 2000)
    setStep(4)
  }

  function downloadPdf() {
    const doc = new jsPDF()
    const biz = currentUser?.businessName ?? currentUser?.fullName ?? 'FUNDI Worker'
    doc.setFontSize(16)
    doc.text('FUNDI Quotation', 14, 20)
    doc.setFontSize(11)
    doc.text(biz, 14, 30)
    doc.text(`Customer: ${customerName}`, 14, 38)
    doc.text(`Trade: ${trade}`, 14, 46)
    doc.text('Job:', 14, 56)
    const split = doc.splitTextToSize(jobDescription, 180)
    doc.text(split, 14, 64)
    let y = 64 + split.length * 6 + 8
    lineItems.forEach((li) => {
      doc.text(`${li.label}: ${formatUGX(li.amount)}`, 14, y)
      y += 8
    })
    doc.setFontSize(13)
    doc.text(`Total: ${formatUGX(grandTotal)}`, 14, y + 4)
    if (notes) doc.text(`Notes: ${notes}`, 14, y + 14)
    doc.setFontSize(9)
    doc.text('Demo quotation from FUNDI — review before sharing.', 14, 280)
    doc.save(`FUNDI-quote-${customerName || 'draft'}.pdf`)
  }

  async function shareText() {
    const text = [
      `FUNDI Quotation — ${currentUser?.businessName ?? currentUser?.fullName}`,
      `Customer: ${customerName}`,
      `Job: ${jobDescription}`,
      ...lineItems.map((li) => `${li.label}: ${formatUGX(li.amount)}`),
      `TOTAL: ${formatUGX(grandTotal)}`,
      expectedCompletion ? `Timeline: ${expectedCompletion}` : '',
      notes ? `Notes: ${notes}` : '',
      exclusions ? `Exclusions: ${exclusions}` : '',
    ]
      .filter(Boolean)
      .join('\n')

    if (navigator.share) {
      await navigator.share({ title: 'FUNDI Quotation', text })
    } else {
      await navigator.clipboard.writeText(text)
      setToast('Quotation copied')
      setTimeout(() => setToast(null), 2000)
    }
  }

  const recent = state.quotations.filter((q) => q.workerId === currentUser?.id).slice(0, 3)

  return (
    <div className="stack">
      <PageHeader title="FUNDI Quote" subtitle="Itemised quotations in UGX — you enter all costs" />

      <div className="steps">
        {[1, 2, 3, 4].map((s) => (
          <span key={s} className={step === s ? 'step active' : 'step'}>
            {s}
          </span>
        ))}
      </div>

      {step === 1 ? (
        <Card className="stack">
          <Field label="Trade">
            <Select value={trade} onChange={(e) => setTrade(e.target.value)}>
              {TRADES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </Select>
          </Field>
          <Field label="Customer name">
            <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
          </Field>
          <Field label="Describe the job in ordinary language" hint="Or type what the customer asked for">
            <Textarea
              rows={4}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="e.g. Three-door wardrobe with drawers for a bedroom in Wakiso"
            />
          </Field>
          <p className="ai-note">{DEMO_AI_LABEL}</p>
          <Button onClick={runHints} disabled={!jobDescription.trim() || loading}>
            {loading ? 'Analysing…' : 'Continue with Demo AI hints'}
          </Button>
          <Button variant="ghost" onClick={() => setStep(2)}>
            Skip AI hints
          </Button>
        </Card>
      ) : null}

      {step === 2 ? (
        <Card className="stack">
          {hints ? (
            <>
              <Chip tone="accent">Demo AI suggestions</Chip>
              <p>{hints.note}</p>
              {hints.missing.length > 0 ? (
                <div>
                  <strong>Ask the customer about:</strong>
                  <ul>
                    {hints.missing.map((m) => (
                      <li key={m}>{m}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="muted">No obvious missing details detected.</p>
              )}
            </>
          ) : null}
          <p className="muted">Enter your own costs. Leave blank if unknown — do not guess with AI prices.</p>
          <div className="grid-2">
            <Field label="Materials (UGX)">
              <Input type="number" value={materials || ''} onChange={(e) => setMaterials(Number(e.target.value) || 0)} />
            </Field>
            <Field label="Labour (UGX)">
              <Input type="number" value={labour || ''} onChange={(e) => setLabour(Number(e.target.value) || 0)} />
            </Field>
            <Field label="Transport (UGX)">
              <Input type="number" value={transport || ''} onChange={(e) => setTransport(Number(e.target.value) || 0)} />
            </Field>
            <Field label="Other (UGX)">
              <Input type="number" value={other || ''} onChange={(e) => setOther(Number(e.target.value) || 0)} />
            </Field>
          </div>
          <Field label="Margin / profit (UGX)" hint="Optional. Suggested % is editable, not a guaranteed price.">
            <Input type="number" value={margin || ''} onChange={(e) => setMargin(Number(e.target.value) || 0)} />
          </Field>
          <Button variant="secondary" onClick={applySuggestedMargin}>
            Apply suggested {hints?.marginSuggestion ?? 10}% margin
          </Button>
          <div className="total-bar">Total: {formatUGX(grandTotal)}</div>
          <Button onClick={() => setStep(3)}>Preview quotation</Button>
          <Button variant="ghost" onClick={() => setStep(1)}>
            Back
          </Button>
        </Card>
      ) : null}

      {step === 3 || step === 4 ? (
        <Card className="stack">
          <div className="row-between">
            <strong>{currentUser?.businessName ?? currentUser?.fullName}</strong>
            <Chip tone="progress">{trade}</Chip>
          </div>
          <p>
            <strong>Customer:</strong> {customerName || '—'}
          </p>
          <p>{jobDescription}</p>
          <ul className="quote-lines">
            {lineItems.map((li) => (
              <li key={li.id}>
                <span>{li.label}</span>
                <span>{formatUGX(li.amount)}</span>
              </li>
            ))}
          </ul>
          <div className="total-bar">Grand total: {formatUGX(grandTotal)}</div>
          <Field label="Expected completion">
            <Input
              value={expectedCompletion}
              onChange={(e) => setExpectedCompletion(e.target.value)}
              placeholder="e.g. 10 days after acceptance"
            />
          </Field>
          <Field label="Valid until">
            <Input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
          </Field>
          <Field label="Notes">
            <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Field>
          <Field label="Exclusions">
            <Textarea rows={2} value={exclusions} onChange={(e) => setExclusions(e.target.value)} />
          </Field>
          <div className="row-wrap">
            <Button onClick={() => save('Draft')}>Save draft</Button>
            <Button variant="accent" onClick={() => save('Shared')}>
              Confirm & mark shared
            </Button>
            <Button variant="secondary" onClick={downloadPdf}>
              Download PDF
            </Button>
            <Button variant="secondary" onClick={shareText}>
              Copy / share
            </Button>
            <Button variant="ghost" onClick={() => setStep(2)}>
              Edit costs
            </Button>
          </div>
          {step === 4 ? (
            <Button variant="secondary" onClick={() => navigate('/worker/work')}>
              Go to My work
            </Button>
          ) : null}
        </Card>
      ) : null}

      {recent.length > 0 ? (
        <div className="stack-sm">
          <h2>Recent quotations</h2>
          {recent.map((q) => (
            <Card key={q.id}>
              <div className="row-between">
                <strong>{q.customerName}</strong>
                <Chip>{q.status}</Chip>
              </div>
              <p className="clamp-2">{q.jobDescription}</p>
              <p>{formatUGX(q.grandTotal)}</p>
            </Card>
          ))}
        </div>
      ) : null}
      <Toast message={toast} />
    </div>
  )
}
