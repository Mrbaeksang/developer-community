interface Toast {
  title?: string
  description?: string
  variant?: 'default' | 'destructive'
}

// Temporary simple toast function for immediate use
export function toast(props: Toast) {
  // This is a temporary implementation that uses console
  // In production, you'd want to use a proper toast library
  if (props.variant === 'destructive') {
    console.error(`${props.title}: ${props.description}`)
  } else {
    console.log(`${props.title}: ${props.description}`)
  }
}

// Hook version for compatibility
export function useToast() {
  return { toast }
}