import { Navigate, Route, Routes } from 'react-router-dom'
import { CustomerLayout, WorkerLayout } from './components/Layout'
import { useApp } from './context/AppContext'
import { Welcome } from './pages/Welcome'
import {
  ComparePage,
  CustomerProfilePage,
  CustomerVoice,
  MessagesPage,
  MyRequests,
  RequestQuote,
  SavedWorkers,
  WorkerPublicProfile,
} from './pages/customer/More'
import { Explore } from './pages/customer/Explore'
import { WorkerHome } from './pages/worker/Home'
import {
  DiscoverJobs,
  EnquiryDetail,
  ExpensesPage,
  InsightsPage,
  PortfolioNew,
  PromisesPage,
  WorkerProfilePage,
} from './pages/worker/More'
import { QuoteBuilder } from './pages/worker/Quote'
import { VoiceBridge } from './pages/worker/Voice'
import { OrderDetail, WorkerWork } from './pages/worker/Work'

function RoleRedirect({ role, children }: { role: 'worker' | 'customer'; children: React.ReactNode }) {
  const { role: current } = useApp()
  if (!current) return <Navigate to="/" replace />
  if (current !== role) {
    return <Navigate to={current === 'worker' ? '/worker/home' : '/customer/explore'} replace />
  }
  return <>{children}</>
}

export default function App() {
  const { role } = useApp()

  return (
    <Routes>
      <Route path="/" element={role ? <Navigate to={role === 'worker' ? '/worker/home' : '/customer/explore'} /> : <Welcome />} />
      <Route path="/profile/:id" element={<WorkerPublicProfile />} />

      <Route
        path="/worker"
        element={
          <RoleRedirect role="worker">
            <WorkerLayout />
          </RoleRedirect>
        }
      >
        <Route path="home" element={<WorkerHome />} />
        <Route path="jobs" element={<DiscoverJobs />} />
        <Route path="work" element={<WorkerWork />} />
        <Route path="order/:id" element={<OrderDetail />} />
        <Route path="enquiry/:id" element={<EnquiryDetail />} />
        <Route path="quote" element={<QuoteBuilder />} />
        <Route path="voice" element={<VoiceBridge />} />
        <Route path="promises" element={<PromisesPage />} />
        <Route path="portfolio/new" element={<PortfolioNew />} />
        <Route path="profile" element={<WorkerProfilePage />} />
        <Route path="insights" element={<InsightsPage />} />
        <Route path="expenses" element={<ExpensesPage />} />
      </Route>

      <Route
        path="/customer"
        element={
          <RoleRedirect role="customer">
            <CustomerLayout />
          </RoleRedirect>
        }
      >
        <Route path="explore" element={<Explore />} />
        <Route path="worker/:id" element={<WorkerPublicProfile />} />
        <Route path="request/:id" element={<RequestQuote />} />
        <Route path="saved" element={<SavedWorkers />} />
        <Route path="compare" element={<ComparePage />} />
        <Route path="requests" element={<MyRequests />} />
        <Route path="messages" element={<MessagesPage />} />
        <Route path="profile" element={<CustomerProfilePage />} />
        <Route path="voice" element={<CustomerVoice />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
