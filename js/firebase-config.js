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
  apiKey: "AIzaSyCLmPCwusdLyQBiY_aKhhdKS-w0nq9muLc",
  authDomain: "tahajjudy.firebaseapp.com",
  projectId: "tahajjudy",
  storageBucket: "tahajjudy.firebasestorage.app",
  messagingSenderId: "60848413032",
  appId: "1:60848413032:web:19fd2d23a278d21bfbdedd",
  measurementId: "G-NLT9NSLSB4"
};

// Global obyekt sifatida ishlatiladi (window.*), chunki file:// protokolida
// ES modullar ishlamaydi. Barcha sahifalar shu faylni <script> orqali chaqiradi.
firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();

// Sessiya doim saqlansin (brauzer yopilsa ham) — ba'zi hollarda
// standart sozlama sessiyani saqlamay, Google kirishdan keyin
// foydalanuvchini qayta login sahifasiga qaytarib yuborishi mumkin edi.
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch((err) => {
  console.error('Persistence sozlashda xatolik:', err);
});
