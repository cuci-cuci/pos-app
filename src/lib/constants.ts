export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1'

export const APP_NAME = 'kelarin'

export const APP_VERSION = '1.0.0'

export const SYNC_INTERVAL_MS = 30_000

export const MAX_RETRY_ATTEMPTS = 4

export const ROLE_TENANT_OWNER = 'tenant_owner' as const
export const ROLE_CASHIER = 'cashier' as const
