export type Role = 'worker' | 'customer' | null

export type JobStatus =
  | 'New'
  | 'Quoted'
  | 'Accepted'
  | 'In progress'
  | 'Completed'
  | 'Awaiting payment'
  | 'Declined'

export type PaymentStatus = 'Not paid' | 'Deposit paid' | 'Partially paid' | 'Paid'

export type QuoteStatus = 'Draft' | 'Shared' | 'Accepted' | 'Declined'

export type PromiseStatus = 'Due today' | 'Due soon' | 'Overdue' | 'Completed' | 'Open'

export interface UserProfile {
  id: string
  role: 'worker' | 'customer'
  fullName: string
  businessName?: string
  phone: string
  trade?: string
  bio: string
  district: string
  town: string
  profileImageUrl?: string
  publicProfileEnabled: boolean
  services: string[]
  serviceAreas: string[]
  availability: 'Available for new work' | 'Busy' | 'Not taking work'
  preferredContact: 'In-app' | 'Phone' | 'Either'
  priceGuidance?: string
  createdAt: string
}

export interface PortfolioProject {
  id: string
  workerId: string
  title: string
  description: string
  category: string
  imageUrls: string[]
  completionDate: string
  publicVisibility: boolean
  testimonialText?: string
  testimonialApproved: boolean
  area?: string
  servicesPerformed: string[]
}

export interface Enquiry {
  id: string
  customerId: string
  customerName: string
  workerId: string
  description: string
  location: string
  preferredDate: string
  imageUrls: string[]
  status: JobStatus
  createdAt: string
  reference: string
}

export interface LineItem {
  id: string
  label: string
  amount: number
  category: 'materials' | 'labour' | 'transport' | 'other'
}

export interface Quotation {
  id: string
  workerId: string
  customerName: string
  orderId?: string
  enquiryId?: string
  jobDescription: string
  lineItems: LineItem[]
  materialsTotal: number
  labourTotal: number
  transportTotal: number
  otherTotal: number
  marginAmount: number
  grandTotal: number
  validUntil?: string
  expectedCompletion?: string
  notes: string
  exclusions: string
  status: QuoteStatus
  createdAt: string
}

export interface Order {
  id: string
  workerId: string
  customerName: string
  customerId?: string
  enquiryId?: string
  quotationId?: string
  title: string
  description: string
  quantity: string
  deadline: string
  quotedAmount: number
  status: JobStatus
  paymentStatus: PaymentStatus
  location: string
  notes: string
  activity: { at: string; text: string }[]
  createdAt: string
}

export interface PromiseItem {
  id: string
  workerId: string
  customerName: string
  orderId?: string
  action: string
  dueAt: string
  status: PromiseStatus
  sourceText: string
  createdAt: string
}

export interface SavedWorker {
  id: string
  customerId: string
  workerId: string
  createdAt: string
}

export interface VoiceTranslation {
  id: string
  userId: string
  sourceLanguage: 'Luganda' | 'English'
  targetLanguage: 'Luganda' | 'English'
  transcript: string
  translation: string
  createdAt: string
}

export interface MessageThread {
  id: string
  participantName: string
  roleSide: 'worker' | 'customer'
  preview: string
  updatedAt: string
  unread: number
  messages: { id: string; from: 'me' | 'them'; text: string; at: string }[]
}

export interface Expense {
  id: string
  workerId: string
  title: string
  category: string
  amount: number
  relatedOrderId?: string
  date: string
  notes: string
}

export interface AppState {
  role: Role
  currentUserId: string | null
  workers: UserProfile[]
  customers: UserProfile[]
  portfolio: PortfolioProject[]
  enquiries: Enquiry[]
  quotations: Quotation[]
  orders: Order[]
  promises: PromiseItem[]
  savedWorkers: SavedWorker[]
  voiceHistory: VoiceTranslation[]
  messages: MessageThread[]
  expenses: Expense[]
  onboardingDone: boolean
}
