import {
  Camera,
  FileText,
  Mic,
  Plus,
  Eye,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { formatDate, formatUGX } from '../../lib/format'
import { Avatar, Button, Card, Chip, PageHeader, SectionTitle, statusTone } from '../../components/ui'

export function WorkerHome() {
  const { state, currentUser } = useApp()
  const navigate = useNavigate()
  const workerId = currentUser?.id ?? ''

  const myEnquiries = state.enquiries.filter((e) => e.workerId === workerId)
  const myOrders = state.orders.filter((o) => o.workerId === workerId)
  const myPromises = state.promises.filter((p) => p.workerId === workerId && p.status !== 'Completed')
  const unpaid = myOrders.filter((o) => o.paymentStatus !== 'Paid')
  const dueSoon = myOrders.filter((o) => {
    const d = new Date(o.deadline)
    const now = new Date()
    const diff = (d.getTime() - now.getTime()) / 86400000
    return diff >= 0 && diff <= 3 && o.status !== 'Completed'
  })
  const expenses = state.expenses.filter((e) => e.workerId === workerId)
  const expenseTotal = expenses.reduce((s, e) => s + e.amount, 0)

  return (
    <div className="stack">
      <PageHeader
        title={`Hello, ${currentUser?.businessName ?? currentUser?.fullName ?? 'Worker'}`}
        subtitle="Your work overview · demo data"
        action={
          <Button onClick={() => navigate('/worker/quote')}>
            <Plus size={16} /> Create quotation
          </Button>
        }
      />

      <div className="stat-grid">
        <Card>
          <span className="stat-label">New enquiries</span>
          <strong className="stat-value">{myEnquiries.filter((e) => e.status === 'New').length}</strong>
        </Card>
        <Card>
          <span className="stat-label">Active jobs</span>
          <strong className="stat-value">
            {myOrders.filter((o) => o.status === 'In progress' || o.status === 'Accepted').length}
          </strong>
        </Card>
        <Card>
          <span className="stat-label">Due soon</span>
          <strong className="stat-value">{dueSoon.length}</strong>
        </Card>
        <Card>
          <span className="stat-label">Unpaid balances</span>
          <strong className="stat-value">{unpaid.length}</strong>
        </Card>
      </div>

      <SectionTitle>Quick actions</SectionTitle>
      <div className="action-grid">
        <Button variant="secondary" onClick={() => navigate('/worker/quote')}>
          <FileText size={16} /> Create quotation
        </Button>
        <Button variant="secondary" onClick={() => navigate('/worker/work?new=1')}>
          <Plus size={16} /> Add an order
        </Button>
        <Button variant="secondary" onClick={() => navigate('/worker/voice')}>
          <Mic size={16} /> Translate voice
        </Button>
        <Button variant="secondary" onClick={() => navigate('/worker/portfolio/new')}>
          <Camera size={16} /> Add completed work
        </Button>
        <Button variant="secondary" onClick={() => navigate(`/profile/${workerId}`)}>
          <Eye size={16} /> View my public profile
        </Button>
        <Button variant="secondary" onClick={() => navigate('/worker/insights')}>
          <TrendingUp size={16} /> Business insights
        </Button>
        <Button variant="secondary" onClick={() => navigate('/worker/expenses')}>
          <Wallet size={16} /> Expenses ({formatUGX(expenseTotal)})
        </Button>
      </div>

      <SectionTitle action={<Link to="/worker/promises">See all</Link>}>Today</SectionTitle>
      <div className="stack-sm">
        {myPromises.length === 0 ? (
          <Card>
            <p className="muted">No promises due. Add one from My work.</p>
          </Card>
        ) : (
          myPromises.slice(0, 4).map((p) => (
            <Card key={p.id} onClick={() => navigate('/worker/promises')}>
              <div className="row-between">
                <div>
                  <strong>{p.action}</strong>
                  <p className="muted">
                    {p.customerName} · {formatDate(p.dueAt)}
                  </p>
                </div>
                <Chip tone={statusTone(p.status)}>{p.status}</Chip>
              </div>
            </Card>
          ))
        )}
      </div>

      <SectionTitle>New enquiries</SectionTitle>
      <div className="stack-sm">
        {myEnquiries.filter((e) => e.status === 'New').length === 0 ? (
          <Card>
            <p className="muted">No new enquiries yet. Customers find you on FUNDI Discover.</p>
          </Card>
        ) : (
          myEnquiries
            .filter((e) => e.status === 'New')
            .map((e) => (
              <Card key={e.id} onClick={() => navigate(`/worker/enquiry/${e.id}`)}>
                <div className="row gap">
                  <Avatar name={e.customerName} />
                  <div className="grow">
                    <div className="row-between">
                      <strong>{e.customerName}</strong>
                      <Chip tone="new">{e.reference}</Chip>
                    </div>
                    <p className="clamp-2">{e.description}</p>
                    <p className="muted">{e.location}</p>
                  </div>
                </div>
              </Card>
            ))
        )}
      </div>
    </div>
  )
}
