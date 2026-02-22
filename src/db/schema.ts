export interface Outlet {
  id: string
  tenantId: string
  name: string
  address: string
  phone: string
  isActive: boolean
}

export interface ServiceCategory {
  id: string
  tenantId: string
  name: string
  description: string
  sortOrder: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Service {
  id: string
  tenantId: string
  categoryId: string
  name: string
  description: string
  unit: string
  pricePerUnit: number
  estimatedDuration: number
  isActive: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface PaymentMethod {
  id: string
  tenantId: string
  name: string
  type: 'cash' | 'qris' | 'bank_transfer' | 'other'
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface TenantConfig {
  id: string
  tenantId: string
  tenantName: string
  address: string
  phone: string
  taxRate: number
  currency: string
  version: number
  updatedAt: string
}

export interface Customer {
  id: string
  tenantId: string
  name: string
  phone: string
  email: string
  address: string
  createdAt: string
  updatedAt: string
}

export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'failed'
export type TransactionStatus = 'completed' | 'cancelled' | 'refunded'

export interface TransactionItem {
  id: string
  serviceId: string
  serviceName: string
  categoryName: string
  unit: string
  quantity: number
  pricePerUnit: number
  subtotal: number
}

export interface Payment {
  id: string
  methodId: string
  methodName: string
  methodType: string
  amount: number
  cashTendered?: number
  changeAmount?: number
}

export interface Transaction {
  id: string
  tenantId: string
  outletId: string
  orderNumber: string
  customerId?: string
  customerName?: string
  items: TransactionItem[]
  payments: Payment[]
  subtotal: number
  discountPercent: number
  discountAmount: number
  taxRate: number
  taxAmount: number
  totalAmount: number
  notes: string
  status: TransactionStatus
  syncStatus: SyncStatus
  syncRetryCount: number
  configVersion: number
  createdAt: string
  updatedAt: string
  syncedAt?: string
}

export type SyncDirection = 'push' | 'pull'

export interface SyncLog {
  id?: number
  direction: SyncDirection
  entityType: string
  recordCount: number
  success: boolean
  errorMessage?: string
  timestamp: string
}

export interface SyncState {
  id: string
  lastPushAt?: string
  lastPullAt?: string
  lastConfigVersion: number
}
