self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const target = new URL(event.notification.data?.url || '/', self.location.origin).href
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      for (const client of windows) {
        if ('focus' in client) {
          if ('navigate' in client && client.url.startsWith(self.location.origin)) {
            return client.navigate(target).then((opened) => opened?.focus() ?? client.focus())
          }
          return client.focus()
        }
      }
      return self.clients.openWindow(target)
    }),
  )
})

self.addEventListener('push', (event) => {
  let payload = { title: 'TaskyPulse', body: 'You have an update.', url: '/' }
  try {
    if (event.data) payload = { ...payload, ...event.data.json() }
  } catch {
    payload.body = event.data?.text() || payload.body
  }
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      data: { url: payload.url || '/' },
    }),
  )
})
