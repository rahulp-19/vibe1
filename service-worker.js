/*
  Firebase Messaging Service Worker
  ---------------------------------
  This file handles notifications when app is closed / in background / locked.
*/

importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

const firebaseConfig = {
  apiKey: "AIzaSyADXensK02bXZU197PtKOr_CNacw-nX1A0",
  authDomain: "vibeus-f1536.firebaseapp.com",
  projectId: "vibeus-f1536",
  storageBucket: "vibeus-f1536.firebasestorage.app",
  messagingSenderId: "464924213539",
  appId: "1:464924213539:web:ef423a7215578d0b4ecc96",
  measurementId: "G-CML58T1FKL"
};

const hasFirebaseConfig = Object.values(firebaseConfig).every(
  (value) => value && !value.startsWith("PASTE_")
);

if (hasFirebaseConfig) {
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    const title = payload?.notification?.title || "Miss You 💗";
    const body = payload?.notification?.body || "Someone misses you 💖";

    self.registration.showNotification(title, {
      body,
      icon: "https://fav.farm/💗",
      badge: "https://fav.farm/💗",
      tag: "miss-you-heartbeat",
      renotify: true,
      requireInteraction: true,
      vibrate: [0, 800, 400, 800, 400, 800],
      data: {
        url: "/",
      },
    });
  });
}

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if ("focus" in client) {
          return client.focus();
        }
      }

      if (clients.openWindow) {
        return clients.openWindow("/");
      }

      return undefined;
    })
  );
});
