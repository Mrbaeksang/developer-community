export interface ApiTest {
  endpoint: string
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  description: string
  implemented: boolean
  requiresAuth?: boolean
  requiresAdmin?: boolean
  body?: unknown
}

export interface ApiCategory {
  name: string
  icon: React.ReactNode
  description: string
  tests: ApiTest[]
}

export interface TestResult {
  status: 'success' | 'error'
  response?: unknown
  error?: string
  statusCode?: number
  duration?: number
}

export interface LogEntry {
  timestamp: string
  type: 'info' | 'success' | 'error' | 'warning'
  message: string
}