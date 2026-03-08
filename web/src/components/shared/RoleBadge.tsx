'use client';

interface RoleBadgeProps {
  role: 'STUDENT' | 'ALUMNI' | 'ADMIN';
  roleBadge: 'blue' | 'gold' | 'red';
}

const dotColor = {
  blue: 'bg-blue-500',
  gold: 'bg-amber-400',
  red:  'bg-red-500',
};

const label = {
  STUDENT: 'Student',
  ALUMNI:  'Alumni',
  ADMIN:   'Admin',
};

export default function RoleBadge({ role, roleBadge }: RoleBadgeProps) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dotColor[roleBadge]}`} />
      <span className="text-xs text-gray-500">{label[role]}</span>
    </span>
  );
}
