import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { DEMO_CUSTOMER, DEMO_WORKER_ID } from '../data/seed'
import { computePromiseStatus, uid } from '../lib/format'
import { loadState, resetState, saveState } from '../lib/storage'
import type {
  AppState,
  Enquiry,
  Expense,
  Order,
  PortfolioProject,
  PromiseItem,
  Quotation,
  Role,
  UserProfile,
  VoiceTranslation,
} from '../types'

interface AppContextValue {
  state: AppState
  role: Role
  currentUser: UserProfile | null
  setRole: (role: Role) => void
  updateProfile: (patch: Partial<UserProfile>) => void
  addEnquiry: (enquiry: Omit<Enquiry, 'id' | 'createdAt' | 'reference' | 'status'>) => Enquiry
  updateEnquiry: (id: string, patch: Partial<Enquiry>) => void
  addQuotation: (q: Omit<Quotation, 'id' | 'createdAt'>) => Quotation
  updateQuotation: (id: string, patch: Partial<Quotation>) => void
  addOrder: (o: Omit<Order, 'id' | 'createdAt' | 'activity'> & { activity?: Order['activity'] }) => Order
  updateOrder: (id: string, patch: Partial<Order>) => void
  addPromise: (p: Omit<PromiseItem, 'id' | 'createdAt' | 'status'>) => PromiseItem
  updatePromise: (id: string, patch: Partial<PromiseItem>) => void
  addPortfolio: (p: Omit<PortfolioProject, 'id'>) => PortfolioProject
  toggleSaved: (workerId: string) => void
  isSaved: (workerId: string) => boolean
  addVoice: (v: Omit<VoiceTranslation, 'id' | 'createdAt'>) => void
  addExpense: (e: Omit<Expense, 'id'>) => void
  deleteExpense: (id: string) => void
  addMessage: (threadId: string, text: string) => void
  resetDemo: () => void
  getWorker: (id: string) => UserProfile | undefined
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => loadState())

  useEffect(() => {
    saveState(state)
  }, [state])

  const currentUser = useMemo(() => {
    if (!state.currentUserId || !state.role) return null
    if (state.role === 'worker') return state.workers.find((w) => w.id === state.currentUserId) ?? null
    return state.customers.find((c) => c.id === state.currentUserId) ?? null
  }, [state])

  const setRole = useCallback((role: Role) => {
    setState((s) => ({
      ...s,
      role,
      onboardingDone: role !== null,
      currentUserId: role === 'worker' ? DEMO_WORKER_ID : role === 'customer' ? DEMO_CUSTOMER : null,
    }))
  }, [])

  const updateProfile = useCallback((patch: Partial<UserProfile>) => {
    setState((s) => {
      if (!s.currentUserId || !s.role) return s
      if (s.role === 'worker') {
        return {
          ...s,
          workers: s.workers.map((w) => (w.id === s.currentUserId ? { ...w, ...patch } : w)),
        }
      }
      return {
        ...s,
        customers: s.customers.map((c) => (c.id === s.currentUserId ? { ...c, ...patch } : c)),
      }
    })
  }, [])

  const addEnquiry = useCallback(
    (enquiry: Omit<Enquiry, 'id' | 'createdAt' | 'reference' | 'status'>) => {
      const full: Enquiry = {
        ...enquiry,
        id: uid('enq'),
        createdAt: new Date().toISOString(),
        reference: `FQ-${Math.floor(1000 + Math.random() * 9000)}`,
        status: 'New',
      }
      setState((s) => ({ ...s, enquiries: [full, ...s.enquiries] }))
      return full
    },
    [],
  )

  const updateEnquiry = useCallback((id: string, patch: Partial<Enquiry>) => {
    setState((s) => ({
      ...s,
      enquiries: s.enquiries.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    }))
  }, [])

  const addQuotation = useCallback((q: Omit<Quotation, 'id' | 'createdAt'>) => {
    const full: Quotation = { ...q, id: uid('quote'), createdAt: new Date().toISOString() }
    setState((s) => ({ ...s, quotations: [full, ...s.quotations] }))
    return full
  }, [])

  const updateQuotation = useCallback((id: string, patch: Partial<Quotation>) => {
    setState((s) => ({
      ...s,
      quotations: s.quotations.map((q) => (q.id === id ? { ...q, ...patch } : q)),
    }))
  }, [])

  const addOrder = useCallback(
    (o: Omit<Order, 'id' | 'createdAt' | 'activity'> & { activity?: Order['activity'] }) => {
      const full: Order = {
        ...o,
        id: uid('ord'),
        createdAt: new Date().toISOString(),
        activity: o.activity ?? [{ at: new Date().toISOString(), text: 'Order created' }],
      }
      setState((s) => ({ ...s, orders: [full, ...s.orders] }))
      return full
    },
    [],
  )

  const updateOrder = useCallback((id: string, patch: Partial<Order>) => {
    setState((s) => ({
      ...s,
      orders: s.orders.map((o) => {
        if (o.id !== id) return o
        const next = { ...o, ...patch }
        if (patch.status || patch.paymentStatus) {
          next.activity = [
            ...o.activity,
            {
              at: new Date().toISOString(),
              text: patch.status
                ? `Status → ${patch.status}`
                : `Payment → ${patch.paymentStatus}`,
            },
          ]
        }
        return next
      }),
    }))
  }, [])

  const addPromise = useCallback((p: Omit<PromiseItem, 'id' | 'createdAt' | 'status'>) => {
    const full: PromiseItem = {
      ...p,
      id: uid('prm'),
      createdAt: new Date().toISOString(),
      status: computePromiseStatus(p.dueAt, false),
    }
    setState((s) => ({ ...s, promises: [full, ...s.promises] }))
    return full
  }, [])

  const updatePromise = useCallback((id: string, patch: Partial<PromiseItem>) => {
    setState((s) => ({
      ...s,
      promises: s.promises.map((p) => {
        if (p.id !== id) return p
        const next = { ...p, ...patch }
        next.status = computePromiseStatus(
          next.dueAt,
          next.status === 'Completed' || patch.status === 'Completed',
        )
        if (patch.status === 'Completed') next.status = 'Completed'
        return next
      }),
    }))
  }, [])

  const addPortfolio = useCallback((p: Omit<PortfolioProject, 'id'>) => {
    const full = { ...p, id: uid('port') }
    setState((s) => ({ ...s, portfolio: [full, ...s.portfolio] }))
    return full
  }, [])

  const toggleSaved = useCallback((workerId: string) => {
    setState((s) => {
      const customerId = s.currentUserId ?? DEMO_CUSTOMER
      const exists = s.savedWorkers.find((x) => x.workerId === workerId && x.customerId === customerId)
      if (exists) {
        return { ...s, savedWorkers: s.savedWorkers.filter((x) => x.id !== exists.id) }
      }
      return {
        ...s,
        savedWorkers: [
          { id: uid('save'), customerId, workerId, createdAt: new Date().toISOString() },
          ...s.savedWorkers,
        ],
      }
    })
  }, [])

  const isSaved = useCallback(
    (workerId: string) => {
      const customerId = state.currentUserId ?? DEMO_CUSTOMER
      return state.savedWorkers.some((x) => x.workerId === workerId && x.customerId === customerId)
    },
    [state.savedWorkers, state.currentUserId],
  )

  const addVoice = useCallback((v: Omit<VoiceTranslation, 'id' | 'createdAt'>) => {
    setState((s) => ({
      ...s,
      voiceHistory: [
        { ...v, id: uid('voice'), createdAt: new Date().toISOString() },
        ...s.voiceHistory,
      ].slice(0, 20),
    }))
  }, [])

  const addExpense = useCallback((e: Omit<Expense, 'id'>) => {
    setState((s) => ({ ...s, expenses: [{ ...e, id: uid('exp') }, ...s.expenses] }))
  }, [])

  const deleteExpense = useCallback((id: string) => {
    setState((s) => ({ ...s, expenses: s.expenses.filter((e) => e.id !== id) }))
  }, [])

  const addMessage = useCallback((threadId: string, text: string) => {
    setState((s) => ({
      ...s,
      messages: s.messages.map((t) =>
        t.id === threadId
          ? {
              ...t,
              preview: text,
              updatedAt: new Date().toISOString(),
              messages: [
                ...t.messages,
                { id: uid('m'), from: 'me' as const, text, at: new Date().toISOString() },
              ],
            }
          : t,
      ),
    }))
  }, [])

  const resetDemo = useCallback(() => {
    setState(resetState())
  }, [])

  const getWorker = useCallback((id: string) => state.workers.find((w) => w.id === id), [state.workers])

  const value: AppContextValue = {
    state,
    role: state.role,
    currentUser,
    setRole,
    updateProfile,
    addEnquiry,
    updateEnquiry,
    addQuotation,
    updateQuotation,
    addOrder,
    updateOrder,
    addPromise,
    updatePromise,
    addPortfolio,
    toggleSaved,
    isSaved,
    addVoice,
    addExpense,
    deleteExpense,
    addMessage,
    resetDemo,
    getWorker,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
