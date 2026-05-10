// public/sw-custom.js
// Custom service worker additions — handles push notifications.
// next-pwa auto-generates sw.js; this file is imported by it via importScripts.
// ─────────────────────────────────────────────────────────────────────────────

// ── Push notification received ────────────────────────────────────────────────
self.addEventListener('push', function (event) {
  if (!event.data) return

  let data = {}
  try {
    data = event.data.json()
  } catch {
    data = { title: 'RoadmapOS', body: event.data.text() }
  }

  const title   = data.title   || 'RoadmapOS ⚡'
  const options = {
    body:    data.body    || "Today's tasks are ready. Let's go.",
    icon:    data.icon    || '/icons/icon-192.png',
    badge:   data.badge   || '/icons/icon-96.png',
    tag:     data.tag     || 'daily-tasks',
    renotify: false,  // don't buzz again if same tag already showing
    requireInteraction: false,
    vibrate: [200, 100, 200],
    data: {
      url:       data.url       || '/dashboard',
      taskCount: data.taskCount || 0,
      week:      data.week      || 1,
    },
    actions: [
      { action: 'open',   title: "Open today's board" },
      { action: 'streak', title: 'View streak' },
    ],
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

// ── Notification click ────────────────────────────────────────────────────────
self.addEventListener('notificationclick', function (event) {
  event.notification.close()

  let url = '/dashboard'
  if (event.action === 'streak') url = '/streak'
  else if (event.notification.data?.url) url = event.notification.data.url

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      // If app already open, focus it and navigate
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus()
          client.navigate(url)
          return
        }
      }
      // Otherwise open new window
      if (clients.openWindow) {
        return clients.openWindow(url)
      }
    })
  )
})

// ── Push subscription change (browser rotated keys) ───────────────────────────
self.addEventListener('pushsubscriptionchange', function (event) {
  event.waitUntil(
    self.registration.pushManager.subscribe({ userVisibleOnly: true })
      .then(function (subscription) {
        // Re-register new subscription with your server
        return fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(subscription),
        })
      })
  )
})
