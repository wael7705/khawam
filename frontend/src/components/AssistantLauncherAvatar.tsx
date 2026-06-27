import { Bot } from 'lucide-react';
import { useSyncExternalStore } from 'react';
import {
  ASSISTANT_LOGO,
  isAssistantImageReady,
  subscribeAssistantImageReady,
} from '../lib/assistantImage';

interface AssistantLauncherAvatarProps {
  className?: string;
  size?: number;
}

export function AssistantLauncherAvatar({ className = '', size = 68 }: AssistantLauncherAvatarProps) {
  const imageReady = useSyncExternalStore(
    subscribeAssistantImageReady,
    isAssistantImageReady,
    () => false,
  );

  return (
    <span
      className={`khawam-assistant__avatar ${imageReady ? 'khawam-assistant__avatar--ready' : ''} ${className}`.trim()}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <span className="khawam-assistant__avatar-core">
        <Bot size={Math.round(size * 0.42)} strokeWidth={2.2} />
      </span>
      <span
        className="khawam-assistant__avatar-art"
        style={{ backgroundImage: `url(${ASSISTANT_LOGO})` }}
      />
    </span>
  );
}
