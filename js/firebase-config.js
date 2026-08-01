// ====================================================================
// FIREBASE KONFIGURATSIYASI
// ====================================================================
// Bu yerga o'zingizning Firebase loyihangiz konfiguratsiyasini joylang.
// Qayerdan olish mumkin:
//   Firebase Console > Project settings (⚙️) > General
//   > "Your apps" bo'limi > Web app (</>) > SDK setup and configuration
//
// Agar hali Firebase loyihasi yaratmagan bo'lsangiz:
//   1. https://console.firebase.google.com ga kiring
//   2. "Add project" bosing, nom bering (masalan: tahajjudy)
//   3. Authentication > Sign-in method: Google va Anonymous'ni yoqing
//   4. Firestore Database > Create database (production mode)
//   5. Project settings > Your apps > "</>" belgisini bosib web app qo'shing
//   6. Chiqqan configni pastga qo'ying
// ====================================================================

const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
  };
  
  // Global obyekt sifatida ishlatiladi (window.*), chunki file:// protokolida
  // ES modullar ishlamaydi. Barcha sahifalar shu faylni <script> orqali chaqiradi.
  firebase.initializeApp(firebaseConfig);
  
  const auth = firebase.auth();
  const db = firebase.firestore();
