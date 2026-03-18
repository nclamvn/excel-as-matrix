// Phase 4: Presence Avatars - Shows who's viewing the workbook
import React, { useMemo } from 'react';
import { usePresenceStore } from '../../stores/presenceStore';
import { UserPresence, PresenceStatus } from '../../types/collab';

interface PresenceAvatarsProps {
  maxVisible?: number;
  size?: 'sm' | 'md' | 'lg';
  showNames?: boolean;
  className?: string;
}

const SIZES = {
  sm: { avatar: 24, font: 10, gap: -6 },
  md: { avatar: 32, font: 12, gap: -8 },
  lg: { avatar: 40, font: 14, gap: -10 },
};

const STATUS_COLORS: Record<PresenceStatus, string> = {
  active: '#22c55e',
  idle: '#eab308',
  away: '#9ca3af',
};

export const PresenceAvatars: React.FC<PresenceAvatarsProps> = ({
  maxVisible = 5,
  size = 'md',
  showNames = false,
  className = '',
}) => {
  const { localUser, remoteUsers, getActiveUserCount } = usePresenceStore();

  const allUsers = useMemo(() => {
    const users: UserPresence[] = [];
    if (localUser) users.push(localUser);
    for (const user of Array.from(remoteUsers.values())) {
      users.push(user);
    }
    return users;
  }, [localUser, remoteUsers]);

  const visibleUsers = allUsers.slice(0, maxVisible);
  const hiddenCount = Math.max(0, allUsers.length - maxVisible);
  const activeCount = getActiveUserCount();
  const sizeConfig = SIZES[size];

  if (allUsers.length === 0) return null;

  return (
    <div className={`presence-avatars ${className}`} style={{ display: 'flex', alignItems: 'center' }}>
      <div style={{ display: 'flex', marginRight: 8 }}>
        {visibleUsers.map((user, index) => (
          <div
            key={user.sessionId}
            style={{
              position: 'relative',
              marginLeft: index === 0 ? 0 : sizeConfig.gap,
              zIndex: visibleUsers.length - index,
            }}
            title={`${user.displayName}${user.userId === localUser?.userId ? ' (you)' : ''}`}
          >
            <Avatar
              user={user}
              size={sizeConfig.avatar}
              fontSize={sizeConfig.font}
              isLocal={user.userId === localUser?.userId}
            />
            <StatusDot status={user.status} size={size} />
          </div>
        ))}
        {hiddenCount > 0 && (
          <div
            style={{
              width: sizeConfig.avatar,
              height: sizeConfig.avatar,
              borderRadius: '50%',
              backgroundColor: '#e5e7eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: sizeConfig.font,
              fontWeight: 500,
              color: '#6b7280',
              marginLeft: sizeConfig.gap,
              border: '2px solid white',
            }}
            title={`${hiddenCount} more users`}
          >
            +{hiddenCount}
          </div>
        )}
      </div>

      {showNames && (
        <div style={{ fontSize: sizeConfig.font, color: '#6b7280' }}>
          {activeCount} active
        </div>
      )}
    </div>
  );
};

interface AvatarProps {
  user: UserPresence;
  size: number;
  fontSize: number;
  isLocal: boolean;
}

const Avatar: React.FC<AvatarProps> = ({ user, size, fontSize, isLocal }) => {
  const initials = user.displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  if (user.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt={user.displayName}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          border: `2px solid ${isLocal ? '#3b82f6' : 'white'}`,
          objectFit: 'cover',
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: user.color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize,
        fontWeight: 600,
        color: 'white',
        border: `2px solid ${isLocal ? '#3b82f6' : 'white'}`,
      }}
    >
      {initials}
    </div>
  );
};

interface StatusDotProps {
  status: PresenceStatus;
  size: 'sm' | 'md' | 'lg';
}

const StatusDot: React.FC<StatusDotProps> = ({ status, size }) => {
  const dotSize = size === 'sm' ? 8 : size === 'md' ? 10 : 12;

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: dotSize,
        height: dotSize,
        borderRadius: '50%',
        backgroundColor: STATUS_COLORS[status],
        border: '2px solid white',
      }}
    />
  );
};

export default PresenceAvatars;
