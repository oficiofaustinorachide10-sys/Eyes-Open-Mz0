import React from 'react';

interface UserAvatarProps {
  src: string;
  status: boolean;
  nickname?: string;
  className?: string;
}

export function UserAvatar({ src, status, nickname, className = 'w-10 h-10' }: UserAvatarProps) {
  return (
    <img
      src={src || "https://i.pravatar.cc/80?img=1"}
      alt={nickname || "Avatar"}
      referrerPolicy="no-referrer"
      className={`${className} rounded-full object-cover shrink-0 ${status ? 'status-online' : 'status-offline'}`}
    />
  );
}
