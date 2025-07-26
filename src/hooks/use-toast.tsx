import * as React from 'react'

interface Toast {
  id: string
  title?: string
  description?: string
  variant?: 'default' | 'destructive'
}

interface ToastState {
  toasts: Toast[]
}

type ToastAction =
  | { type: 'ADD_TOAST'; toast: Toast }
  | { type: 'REMOVE_TOAST'; id: string }

const toastReducer = (state: ToastState, action: ToastAction): ToastState => {
  switch (action.type) {
    case 'ADD_TOAST':
      return {
        toasts: [...state.toasts, action.toast],
      }
    case 'REMOVE_TOAST':
      return {
        toasts: state.toasts.filter((t) => t.id !== action.id),
      }
    default:
      return state
  }
}

const ToastContext = React.createContext<{
  state: ToastState
  dispatch: React.Dispatch<ToastAction>
}>({
  state: { toasts: [] },
  dispatch: () => null,
})

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = React.useReducer(toastReducer, { toasts: [] })

  return (
    <ToastContext.Provider value={{ state, dispatch }}>
      {children}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = React.useContext(ToastContext)
  
  const toast = React.useCallback(
    (props: Omit<Toast, 'id'>) => {
      const id = Math.random().toString(36).substr(2, 9)
      const toast = { ...props, id }
      
      context.dispatch({ type: 'ADD_TOAST', toast })
      
      // Auto-dismiss after 3 seconds
      setTimeout(() => {
        context.dispatch({ type: 'REMOVE_TOAST', id })
      }, 3000)
    },
    [context]
  )

  return { toast, toasts: context.state.toasts }
}

// Temporary simple toast function for immediate use
export function toast(props: Omit<Toast, 'id'>) {
  // This is a temporary implementation that uses alert
  // In production, you'd want to use a proper toast library
  if (props.variant === 'destructive') {
    console.error(`${props.title}: ${props.description}`)
  } else {
    console.log(`${props.title}: ${props.description}`)
  }
}