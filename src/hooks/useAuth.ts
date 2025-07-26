import { useCurrentUser } from './use-api'

export function useAuth() {
  const { data: user, isLoading, error } = useCurrentUser()
  
  return {
    user,
    isLoading,
    error,
    isAuthenticated: !!user && !error
  }
}