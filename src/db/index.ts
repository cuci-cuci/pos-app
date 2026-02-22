import Dexie, { type Table } from 'dexie'
import type {
  ServiceCategory,
  Service,
  PaymentMethod,
  TenantConfig,
  Customer,
  Transaction,
  SyncLog,
  SyncState,
  Outlet,
} from './schema'

export class PosDatabase extends Dexie {
  serviceCategories!: Table<ServiceCategory, string>
  services!: Table<Service, string>
  paymentMethods!: Table<PaymentMethod, string>
  tenantConfig!: Table<TenantConfig, string>
  customers!: Table<Customer, string>
  transactions!: Table<Transaction, string>
  syncLogs!: Table<SyncLog, number>
  syncState!: Table<SyncState, string>
  outlets!: Table<Outlet, string>

  constructor() {
    super('LaundryPOS')

    this.version(1).stores({
      serviceCategories: 'id, tenantId, sortOrder',
      services: 'id, [tenantId+categoryId], tenantId',
      paymentMethods: 'id, tenantId',
      tenantConfig: 'id',
      customers: 'id, tenantId, phone, name',
      transactions: 'id, [tenantId+syncStatus], [tenantId+status], createdAt',
      syncLogs: '++id, direction, timestamp',
      syncState: 'id',
    })

    this.version(2).stores({
      serviceCategories: 'id, tenantId, sortOrder',
      services: 'id, [tenantId+categoryId], tenantId',
      paymentMethods: 'id, tenantId',
      tenantConfig: 'id',
      customers: 'id, tenantId, phone, name',
      transactions: 'id, [tenantId+syncStatus], [tenantId+status], createdAt, outletId',
      syncLogs: '++id, direction, timestamp',
      syncState: 'id',
      outlets: 'id, tenantId',
    })
  }
}

export const db = new PosDatabase()
