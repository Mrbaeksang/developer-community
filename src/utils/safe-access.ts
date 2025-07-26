/**
 * Safe access utilities for handling potentially undefined/null data
 */

/**
 * Safely access avatar URL with proper null/undefined handling
 */
export function getAvatarUrl(
  source: unknown,
  fallback: string | null | undefined = undefined
): string | undefined {
  if (!source || typeof source !== 'object') {
    return fallback ?? undefined
  }
  
  // Check various possible avatar URL paths
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sourceObj = source as Record<string, unknown>
  const avatarUrl = 
    sourceObj.avatar_url ||
    sourceObj.author_avatar_url ||
    sourceObj.profiles?.avatar_url ||
    sourceObj.author?.avatar_url
  
  return avatarUrl || fallback
}

/**
 * Safely get display name from various sources
 */
export function getDisplayName(
  source: unknown,
  fallback: string = 'Unknown'
): string {
  if (!source || typeof source !== 'object') {
    return fallback
  }
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sourceObj = source as Record<string, unknown>
  return (
    sourceObj.display_name ||
    sourceObj.author_display_name ||
    sourceObj.username ||
    sourceObj.author_username ||
    sourceObj.full_name ||
    sourceObj.profiles?.display_name ||
    sourceObj.profiles?.username ||
    sourceObj.author?.display_name ||
    sourceObj.author?.username ||
    sourceObj.author?.full_name ||
    fallback
  )
}

/**
 * Safely get user initial for avatar fallback
 */
export function getUserInitial(
  source: unknown,
  fallback: string = '?'
): string {
  const name = getDisplayName(source, '')
  return name[0]?.toUpperCase() || fallback
}