export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

// Generate color based on name hash
export function getAvatarColor(name: string, primaryColor?: string): string {
  if (primaryColor) return primaryColor
  
  const colors = [
    '#005c55', // primary
    '#855300', // secondary  
    '#7c3aed', // violet
    '#2563eb', // blue
    '#059669', // emerald
    '#d97706', // amber
    '#dc2626', // red
    '#db2777', // pink
    '#0891b2', // cyan
  ]
  
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}