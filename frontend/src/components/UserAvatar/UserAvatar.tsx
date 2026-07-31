import styles from './UserAvatar.module.css';

interface UserAvatarProps {
  username: string;
  avatar?: string | null;
  size?: number;
}

function usernameToHue(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % 360;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

const DEFAULT_AVATAR_HOST = 'ui-avatars.com';

function isDefaultAvatar(avatar: string | null | undefined): boolean {
  if (!avatar) return true;
  return avatar.includes(DEFAULT_AVATAR_HOST);
}

export default function UserAvatar({ username, avatar, size = 36 }: UserAvatarProps) {
  const showImage = avatar && !isDefaultAvatar(avatar);
  const hue = usernameToHue(username);
  const initials = getInitials(username);

  const gradientStyle = {
    background: `linear-gradient(135deg, hsl(${hue}, 70%, 50%), hsl(${(hue + 40) % 360}, 80%, 38%))`,
    width: size,
    height: size,
    fontSize: size * 0.38,
  } as React.CSSProperties;

  if (showImage) {
    return (
      <img
        src={avatar}
        alt={username}
        className={styles.avatar}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <span className={styles.initials} style={gradientStyle} aria-label={username}>
      {initials}
    </span>
  );
}
