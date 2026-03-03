export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1'

export const APP_NAME = 'kelarin'

export const SUPPORT_EMAIL = 'help@kelarin.co.id'

export const APP_VERSION = '1.0.0'

export const SYNC_INTERVAL_MS = 30_000

export const MAX_RETRY_ATTEMPTS = 4

export const ROLE_TENANT_OWNER = 'tenant_owner' as const
export const ROLE_CASHIER = 'cashier' as const

export const GATEWAY_POLL_INTERVAL_MS = 3_000
export const GATEWAY_COUNTDOWN_INTERVAL_MS = 1_000
export const GATEWAY_MAX_RETRIES = 5
