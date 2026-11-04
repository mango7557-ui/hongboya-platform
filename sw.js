// ── Service Worker for Push Notifications ──
const SW_VERSION = 'v1.0';

self.addEventListener('install', e => {
    self.skipWaiting();
});

self.addEventListener('activate', e => {
    e.waitUntil(self.clients.claim());
});

// 백그라운드 메시지 수신 (postMessage로 폴링 결과 전달)
self.addEventListener('message', e => {
    if (e.data && e.data.type === 'NEW_CONSULT') {
        const { brand, phone, region, count } = e.data;
        self.registration.showNotification('🔔 새 상담 신청이 들어왔습니다!', {
            body: `브랜드: ${brand || '미기재'}\n연락처: ${phone || '미기재'}\n지역: ${region || '미기재'}`,
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            tag: 'new-consult',          // 같은 tag면 덮어쓰기 (중복 방지)
            renotify: true,
            vibrate: [200, 100, 200],
            data: { url: self.location.origin + '/admin.html' },
            actions: [
                { action: 'open',    title: '📋 확인하기' },
                { action: 'dismiss', title: '닫기' }
            ]
        });
    }
});

// 알림 클릭 시 admin.html 열기
self.addEventListener('notificationclick', e => {
    e.notification.close();
    if (e.action === 'dismiss') return;
    const targetUrl = (e.notification.data && e.notification.data.url) || '/admin.html';
    e.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
            for (const c of clients) {
                if (c.url.includes('admin.html') && 'focus' in c) return c.focus();
            }
            return self.clients.openWindow(targetUrl);
        })
    );
});
