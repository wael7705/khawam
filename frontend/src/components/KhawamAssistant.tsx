import { Loader2, Send, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  streamAssistantReply,
  type AssistantMessage,
} from '../lib/assistantStream';
import { renderAssistantMarkdown } from '../lib/assistantMarkdown';
import { AssistantLauncherAvatar } from './AssistantLauncherAvatar';
import { AssistantTypingWave } from './AssistantTypingWave';
import './KhawamAssistant.css';

const SUGGESTIONS = [
  'ما هي الخدمات المتوفرة؟',
  'كيف أطلب خدمة؟',
  'أين موقعكم؟',
  'كم يستغرق تنفيذ الطلب؟',
  'كيف أتابع طلبي؟',
  'هل عندكم توصيل؟',
];

const WELCOME: AssistantMessage = {
  id: 'welcome',
  role: 'assistant',
  text:
    'أهلاً بك في **خوّام للدعاية والإعلان** 👋\n\nأنا مساعد خوام، جاهز لمساعدتك في:\n- التعرّف على خدماتنا من المتجر\n- استعراض أعمالنا السابقة\n- شرح خطوات طلب أي خدمة\n- الإجابة عن استفساراتك العامة\n\nكيف يمكنني مساعدتك اليوم؟',
};

export function KhawamAssistant() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<AssistantMessage[]>([WELCOME]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, busy]);

  useEffect(() => {
    if (open) {
      window.setTimeout(() => inputRef.current?.focus(), 100);
    }
    return () => {
      abortRef.current?.abort();
    };
  }, [open]);

  const handleSend = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || busy) return;

    const userMessage: AssistantMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: trimmed,
    };

    const assistantId = `assistant-${Date.now()}`;
    const nextMessages = [...messages, userMessage];
    setMessages([...nextMessages, { id: assistantId, role: 'assistant', text: '' }]);
    setInput('');
    setBusy(true);
    setError(null);

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      await streamAssistantReply(
        nextMessages,
        (delta) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, text: m.text + delta } : m,
            ),
          );
        },
        controller.signal,
      );
    } catch (err: unknown) {
      if (controller.signal.aborted) return;
      setError(err instanceof Error ? err.message : 'فشل الاتصال بالمساعد');
      setMessages((prev) => prev.filter((m) => m.id !== assistantId || m.text.length > 0));
    } finally {
      setBusy(false);
    }
  }, [busy, messages]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void handleSend(input);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend(input);
    }
  };

  return (
    <div dir="rtl" className="khawam-assistant">
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="افتح مساعد خوام"
          className="khawam-assistant__launcher"
        >
          <span className="khawam-assistant__launcher-halo" aria-hidden />
          <span className="khawam-assistant__launcher-glow" aria-hidden />
          <span className="khawam-assistant__launcher-float">
            <span className="khawam-assistant__launcher-wiggle">
              <AssistantLauncherAvatar className="khawam-assistant__launcher-logo" size={68} />
            </span>
          </span>
          <span className="khawam-assistant__launcher-tooltip">مساعد خوام</span>
        </button>
      )}

      {open && (
        <div className="khawam-assistant__panel">
          <div className="khawam-assistant__header">
            <div className="khawam-assistant__header-info">
              <div className="khawam-assistant__header-logo-wrap">
                <AssistantLauncherAvatar className="khawam-assistant__header-logo" size={40} />
              </div>
              <div>
                <div className="khawam-assistant__header-title">مساعد خوام</div>
                <div className="khawam-assistant__header-status">
                  <span className="khawam-assistant__status-dot" />
                  متصل الآن
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="إغلاق"
              className="khawam-assistant__close"
            >
              <X size={20} />
            </button>
          </div>

          <div ref={scrollRef} className="khawam-assistant__messages">
            {messages.map((m) => (
              <MessageBubble key={m.id} message={m} />
            ))}
            {busy && (
              <div className="khawam-assistant__typing" aria-live="polite">
                <AssistantTypingWave />
                <span>مساعد خوام يكتب...</span>
              </div>
            )}
            {error && (
              <div className="khawam-assistant__error">
                حدث خطأ في الاتصال. يُرجى المحاولة مجدداً أو التواصل عبر الواتساب.
              </div>
            )}

            {messages.length <= 1 && (
              <div className="khawam-assistant__suggestions">
                <div className="khawam-assistant__suggestions-label">اقتراحات سريعة:</div>
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => void handleSend(s)}
                    disabled={busy}
                    className="khawam-assistant__suggestion-btn"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          <form onSubmit={onSubmit} className="khawam-assistant__composer">
            <div className="khawam-assistant__input-wrap">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                rows={1}
                placeholder="اكتب سؤالك..."
                className="khawam-assistant__input"
              />
              <button
                type="submit"
                disabled={!input.trim() || busy}
                aria-label="إرسال"
                className="khawam-assistant__send"
              >
                {busy ? <Loader2 size={16} className="khawam-assistant__spin" /> : <Send size={16} />}
              </button>
            </div>
            <div className="khawam-assistant__footer-note">
              مدعوم بالذكاء الاصطناعي · خوّام للدعاية والإعلان
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function MessageBubble({ message }: { message: AssistantMessage }) {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div className="khawam-assistant__bubble-row khawam-assistant__bubble-row--user">
        <div className="khawam-assistant__bubble khawam-assistant__bubble--user">{message.text}</div>
      </div>
    );
  }

  return (
    <div className="khawam-assistant__bubble-row khawam-assistant__bubble-row--assistant">
      <div className="khawam-assistant__bubble khawam-assistant__bubble--assistant">
        {renderAssistantMarkdown(message.text)}
      </div>
    </div>
  );
}
