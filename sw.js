const CACHE = 'habitos-rpg-v2';
const ASSETS = ['./index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).catch(() => caches.match('./index.html')))
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.matchAll({type:'window'}).then(cls => {
    const c = cls.find(x => x.url.includes('index.html') || x.url.endsWith('/'));
    if(c) return c.focus();
    return clients.openWindow('./index.html');
  }));
});

// Handle scheduled notification messages from the app
self.addEventListener('message', e => {
  if(e.data && e.data.type === 'SCHEDULE_NOTIFICATIONS') {
    // Store notification times in SW scope
    self.notifTimes = e.data.times;
    self.notifEnabled = e.data.enabled;
  }
  if(e.data && e.data.type === 'SHOW_NOTIF') {
    const {title, body} = e.data;
    self.registration.showNotification(title, {
      body,
      icon: './icon-192.png',
      badge: './icon-192.png',
      vibrate: [200, 100, 200],
      tag: 'habitos-reminder',
      renotify: true,
      data: { url: './index.html' }
    });
  }
});
