export function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

  const colors = [
    'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-green-600',
    'bg-teal-500', 'bg-blue-600', 'bg-indigo-600', 'bg-purple-600',
  ]
  const color = colors[initials.charCodeAt(0) % colors.length]

  const s = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-12 w-12 text-base' }[size]

  return (
    <div className={`${s} ${color} rounded-full flex items-center justify-center text-white font-medium flex-shrink-0`}>
      {initials || '?'}
    </div>
  )
}
