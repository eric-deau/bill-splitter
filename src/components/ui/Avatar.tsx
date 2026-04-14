import { cn, getInitials } from '@/lib/utils'
import { COLOR_MAP, type MemberColor } from '@/types'

interface AvatarProps {
  name: string
  color: MemberColor
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Avatar({ name, color, size = 'md', className }: AvatarProps) {
  const colors = COLOR_MAP[color]
  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-body font-medium shrink-0',
        colors.bg,
        colors.text,
        {
          'size-7 text-xs': size === 'sm',
          'size-9 text-sm': size === 'md',
          'size-12 text-base': size === 'lg',
        },
        className
      )}
    >
      {getInitials(name)}
    </div>
  )
}
