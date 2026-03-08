'use client';

interface UserAvatarProps {
  name: string;
  initials: string;
  profilePictureUrl?: string;
  roleBadge?: 'blue' | 'gold' | 'red';
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-16 h-16 text-xl',
};

const badgeColors = {
  blue: 'bg-blue-500',
  gold: 'bg-amber-400',
  red:  'bg-red-500',
};

export default function UserAvatar({
  name,
  initials,
  profilePictureUrl,
  roleBadge = 'blue',
  size = 'md',
}: UserAvatarProps) {
  const base = sizeClasses[size];
  const bg   = badgeColors[roleBadge];

  if (profilePictureUrl) {
    return (
      <div className={`relative flex-shrink-0 ${base}`}>
        <img
          src={profilePictureUrl}
          alt={name}
          className={`${base} rounded-full object-cover`}
        />
      </div>
    );
  }

  return (
    <div
      className={`${base} ${bg} rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0`}
      title={name}
    >
      {initials}
    </div>
  );
}
