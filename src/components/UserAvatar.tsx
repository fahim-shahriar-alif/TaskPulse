const sizes = {
  sm: 'h-9 w-9 text-xs rounded-full',
  md: 'h-10 w-10 text-sm rounded-2xl',
  lg: 'h-16 w-16 text-xl rounded-3xl',
  xl: 'h-20 w-20 text-2xl rounded-full',
} as const

type UserAvatarProps = {
  photo?: string
  name: string
  size?: keyof typeof sizes
  className?: string
}

export function UserAvatar({ photo, name, size = 'md', className = '' }: UserAvatarProps) {
  const initial = (name || 'T').slice(0, 1).toUpperCase()
  const box = `${sizes[size]} ${className}`.trim()

  if (photo) {
    return <img src={photo} alt="" className={`${box} overflow-hidden object-cover`} />
  }

  return (
    <div className={`grid place-items-center overflow-hidden bg-indigo-500/15 font-semibold text-indigo-400 ${box}`}>
      {initial}
    </div>
  )
}
