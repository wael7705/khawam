/**
 * نقطة دخول تشغيل السيرفر: تسجيل فوري قبل تحميل config/app لرصد التعطل أثناء التحميل.
 */
console.log('[server] starting...');

import('./server.js').catch((err: unknown) => {
  console.error('[server] failed to start:', err);
  process.exit(1);
});
