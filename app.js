/*
  Miss You 💗 - Vanilla JS PWA
  ------------------------------------------------------
  HOW TO CONFIGURE FIREBASE (beginner friendly):
  1) Create a Firebase project.
  2) Enable Realtime Database (or switch to Firestore if you prefer).
  3) Enable Cloud Messaging.
  4) Create a web app in Firebase and paste your config below.
  5) Create a Web Push certificate (VAPID key) and paste it below.
  6) In Firebase console, copy your service worker sender id if needed.

  IMPORTANT:
  - This app uses two fixed users: Rahul and Nikki.
  - Change USER_IDS if you want different names later.
*/

const firebaseConfig = {
  apiKey: "AIzaSyADXensK02bXZU197PtKOr_CNacw-nX1A0",
  authDomain: "vibeus-f1536.firebaseapp.com",
  projectId: "vibeus-f1536",
  storageBucket: "vibeus-f1536.firebasestorage.app",
  messagingSenderId: "464924213539",
  appId: "1:464924213539:web:ef423a7215578d0b4ecc96",
  measurementId: "G-CML58T1FKL"
};

const VAPID_KEY = BL2YFP3mG9ygtWhddVZ8GdeB6Tbllu9ZMw4AUO3bouaeVpPE2F4MXM78YwsASpKhca2VH1K4DCwHPttbEVLoIIE;

const USER_IDS = ["Rahul", "Nikki"];
let currentUser = localStorage.getItem("missYouUser") || USER_IDS[0];

const dbPaths = {
  tokens: "miss-you/tokens",
  events: "miss-you/events",
};

const missYouBtn = document.getElementById("missYouBtn");
const enableNotificationsBtn = document.getElementById("enableNotificationsBtn");
const statusText = document.getElementById("statusText");
const heartsLayer = document.getElementById("heartsLayer");
const userButtons = document.querySelectorAll(".user-btn");

const callLikeVibration = [0, 800, 400, 800, 400, 800];

let app;
let messaging;
let database;

initializeApp();
bindUI();
registerServiceWorker();

async function initializeApp() {
  const hasFirebaseConfig = Object.values(firebaseConfig).every(
    (value) => value && !value.startsWith("PASTE_")
  );

  if (!hasFirebaseConfig || VAPID_KEY.startsWith("PASTE_")) {
    setStatus("Add Firebase config + VAPID key in app.js first ✨");
    return;
  }

  app = firebase.initializeApp(firebaseConfig);
  database = firebase.database();
  messaging = firebase.messaging();

  listenForIncomingEvents();
  updateUserUI();

  // Handle push while app is open.
  messaging.onMessage((payload) => {
    const bodyText = payload?.notification?.body || "Someone misses you 💖";
    setStatus(bodyText);

    if (navigator.vibrate) {
      navigator.vibrate(callLikeVibration);
    }
  });
}

function bindUI() {
  updateUserUI();

  userButtons.forEach((button) => {
    button.addEventListener("click", () => {
      currentUser = button.dataset.user;
      localStorage.setItem("missYouUser", currentUser);
      updateUserUI();
      setStatus(`You are ${currentUser}. Ready to send love ❤️`);
    });
  });

  missYouBtn.addEventListener("click", async () => {
    missYouBtn.classList.remove("ripple");
    void missYouBtn.offsetWidth;
    missYouBtn.classList.add("ripple");

    spawnHearts();

    const receiver = currentUser === "Rahul" ? "Nikki" : "Rahul";
    const message = `${currentUser} misses you 💖`;

    setStatus(`Sending to ${receiver}…`);

    if (!database) {
      setStatus("Firebase is not configured yet.");
      return;
    }

    try {
      await database.ref(dbPaths.events).push({
        from: currentUser,
        to: receiver,
        message,
        createdAt: Date.now(),
      });
      setStatus(`Sent: ${message}`);
    } catch (error) {
      console.error("Failed to send event", error);
      setStatus("Could not send. Check Firebase rules and config.");
    }
  });

  enableNotificationsBtn.addEventListener("click", async () => {
    if (!messaging || !database) {
      setStatus("Configure Firebase first.");
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("Notification permission denied.");
        return;
      }

      const token = await messaging.getToken({ vapidKey: VAPID_KEY });
      if (!token) {
        setStatus("Could not get push token.");
        return;
      }

      await database.ref(`${dbPaths.tokens}/${currentUser}`).set({
        token,
        updatedAt: Date.now(),
      });

      setStatus(`Notifications are ready for ${currentUser} ✅`);
      enableNotificationsBtn.textContent = "Notifications enabled";
      enableNotificationsBtn.disabled = true;
    } catch (error) {
      console.error("Notification setup failed", error);
      setStatus("Notification setup failed. Check HTTPS + Firebase setup.");
    }
  });
}

function listenForIncomingEvents() {
  // Lightweight signal listener so UI updates when app is open.
  database.ref(dbPaths.events).limitToLast(20).on("child_added", (snapshot) => {
    const event = snapshot.val();
    if (!event || event.to !== currentUser) return;

    setStatus(event.message);

    if (navigator.vibrate) {
      navigator.vibrate(callLikeVibration);
    }
  });
}

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  try {
    await navigator.serviceWorker.register("./service-worker.js");
  } catch (error) {
    console.error("Service worker registration failed", error);
  }
}

function spawnHearts() {
  const hearts = ["💗", "💖", "❤️", "💘", "💕"];

  for (let i = 0; i < 12; i += 1) {
    const heart = document.createElement("span");
    heart.className = "heart";
    heart.textContent = hearts[Math.floor(Math.random() * hearts.length)];
    heart.style.left = `${8 + Math.random() * 84}%`;
    heart.style.animationDelay = `${Math.random() * 180}ms`;
    heart.style.setProperty("--tilt", `${-14 + Math.random() * 28}deg`);

    heartsLayer.appendChild(heart);
    setTimeout(() => heart.remove(), 1400);
  }
}

function updateUserUI() {
  userButtons.forEach((button) => {
    const isActive = button.dataset.user === currentUser;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-checked", String(isActive));
  });
}

function setStatus(text) {
  statusText.textContent = text;
}
