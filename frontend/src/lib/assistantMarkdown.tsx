import type { ReactNode } from 'react';
import { MapPin } from 'lucide-react';
import { isGoogleMapsUrl } from './companyLocation';

const MARKDOWN_SPLIT =
  /(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\)|https?:\/\/[^\s)]+)/g;

function isGpsLinkLabel(label: string): boolean {
  const normalized = label.trim().toLowerCase();
  return (
    normalized === 'gps' ||
    normalized.includes('📍') ||
    normalized.includes('خريطة') ||
    normalized.includes('موقع')
  );
}

function isWhatsAppLink(href: string, label: string): boolean {
  return /wa\.me|whatsapp/i.test(href) || label.includes('واتساب');
}

function isServiceOrderLink(href: string): boolean {
  return /\/order\//.test(href);
}

function GpsLink({ href }: { href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="khawam-assistant__gps-btn"
    >
      <MapPin size={14} aria-hidden />
      <span>GPS</span>
    </a>
  );
}

function AssistantLink({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  if (isGoogleMapsUrl(href) || isGpsLinkLabel(label)) {
    return <GpsLink href={href} />;
  }

  const className = isServiceOrderLink(href)
    ? 'khawam-assistant__service-link'
    : isWhatsAppLink(href, label)
      ? 'khawam-assistant__whatsapp-link'
      : undefined;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      {label}
    </a>
  );
}

export function renderAssistantMarkdown(text: string): ReactNode {
  const parts = text.split(MARKDOWN_SPLIT);
  return parts.map((part, index) => {
    if (!part) return null;

    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }

    const linkMatch = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part);
    if (linkMatch?.[1] && linkMatch[2]) {
      return (
        <AssistantLink key={index} label={linkMatch[1]} href={linkMatch[2]} />
      );
    }

    if (/^https?:\/\//.test(part)) {
      if (isGoogleMapsUrl(part)) {
        return <GpsLink key={index} href={part} />;
      }
      if (isServiceOrderLink(part)) {
        return (
          <a key={index} href={part} className="khawam-assistant__service-link">
            طلب الخدمة
          </a>
        );
      }
      if (/wa\.me/i.test(part)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="khawam-assistant__whatsapp-link"
          >
            واتساب
          </a>
        );
      }
      return null;
    }

    return <span key={index}>{part}</span>;
  });
}
