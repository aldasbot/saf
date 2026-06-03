// ==================== FIREBASE KURULUMU ====================
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDCkFVXfK53Uqtj13cOhKIE3pg3bLmyTX4",
  authDomain: "buydog.firebaseapp.com",
  projectId: "buydog",
  storageBucket: "buydog.firebasestorage.app",
  messagingSenderId: "360970981236",
  appId: "1:360970981236:web:2b1005e6abc80655ada621",
  measurementId: "G-NXKK8EJ9RV"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ==================== MEVCUT KREDİ HESAPLAYICI (DÜZELTİLMİŞ) ====================
const amountInput = document.getElementById("amount");
const monthSelect = document.getElementById("month");
const depositSpan = document.getElementById("deposit");
const returnSpan = document.getElementById("return");
const calculateBtn = document.getElementById("calculateBtn");
const amountWarning = document.getElementById("amountWarning");

function calculateLoan(showWarning = true) {
  let rawValue = amountInput.value.trim();
  if (rawValue === "") {
    if (showWarning) showAmountWarning("Lütfen bir kredi tutarı girin.");
    return false;
  }
  let value = Number(rawValue);
  if (isNaN(value)) {
    if (showWarning) showAmountWarning("Geçerli bir sayı girin.");
    return false;
  }
  if (value < 1000) {
    if (showWarning) showAmountWarning("Minimum kredi tutarı 1000₺'dir.");
    return false;
  }
  hideAmountWarning();
  const depositValue = value * 0.10;
  let returnValue = value;
  if (monthSelect.value === "2") returnValue = value * 1.10;
  if (monthSelect.value === "3") returnValue = value * 1.15;
  depositSpan.innerText = `${depositValue.toFixed(0)}₺`;
  returnSpan.innerText = `${returnValue.toFixed(0)}₺`;
  return true;
}

function showAmountWarning(msg) {
  if (amountWarning) {
    amountWarning.innerText = msg;
    amountWarning.style.display = "block";
  }
  depositSpan.innerText = "—";
  returnSpan.innerText = "—";
}

function hideAmountWarning() {
  if (amountWarning) amountWarning.style.display = "none";
}

if (calculateBtn) {
  calculateBtn.addEventListener("click", () => calculateLoan(true));
}
if (amountInput) {
  amountInput.addEventListener("input", () => hideAmountWarning());
  amountInput.addEventListener("blur", () => {
    let val = Number(amountInput.value);
    if (val < 1000 && val !== 0) {
      showAmountWarning("Minimum kredi tutarı 1000₺'dir.");
    }
  });
}
if (monthSelect) {
  monthSelect.addEventListener("change", () => {
    if (amountInput.value && Number(amountInput.value) >= 1000) calculateLoan(true);
  });
}
// Sayfa yüklenince ilk hesaplama
if (amountInput && amountInput.value && Number(amountInput.value) >= 1000) calculateLoan(false);

// ==================== FORUM DOĞRULAMA (MEVCUT) ====================
const submitBtn = document.getElementById("submitApplication");
const successBox = document.getElementById("successMessage");
const errorBox = document.getElementById("errorMessage");

function showError(msg) {
  if (errorBox) {
    errorBox.style.display = "block";
    errorBox.innerText = msg;
  }
  if (successBox) successBox.style.display = "none";
  setTimeout(() => {
    if (errorBox) errorBox.style.display = "none";
  }, 4000);
}

function showSuccess(msg) {
  if (successBox) {
    successBox.style.display = "block";
    successBox.innerText = msg || "✅ Başvurunuz başarıyla kaydedildi! En kısa sürede dönüş yapılacak.";
  }
  if (errorBox) errorBox.style.display = "none";
}

function validateForm() {
  const fullname = document.getElementById("fullname")?.value.trim();
  const phone = document.getElementById("phone")?.value.trim();
  const email = document.getElementById("email")?.value.trim();
  const tc = document.getElementById("tc")?.value.trim();
  const cardname = document.getElementById("cardname")?.value.trim();
  const cardnumber = document.getElementById("cardnumber")?.value.trim();
  const fileInput = document.getElementById("depositSlip");

  if (!fullname) return showError("Ad soyad giriniz.");
  if (!phone) return showError("Telefon numarası giriniz.");
  if (!email || !email.includes("@")) return showError("Geçerli e-posta giriniz.");
  if (!tc || tc.length !== 11 || isNaN(tc)) return showError("TC Kimlik No 11 haneli olmalı.");
  if (!cardname) return showError("Kart sahibi adı giriniz.");
  if (!cardnumber || cardnumber.replace(/\s/g, '').length < 13) return showError("Geçerli kart numarası giriniz.");
  if (fileInput && !fileInput.files.length) return showError("Deposit dekontunu yükleyin.");
  return true;
}

// ==================== FIREBASE İŞLEMLERİ (KAYIT, GİRİŞ, BAŞVURU KAYDETME) ====================
let currentUser = null;

// Kullanıcı arayüzüne buton ekleme (navbar)
function addAuthButtons() {
  const navLinks = document.querySelector(".nav-links");
  if (!navLinks) return;
  // Daha önce eklenmişse tekrar ekleme
  if (document.getElementById("firebase-login-btn")) return;

  const loginBtn = document.createElement("button");
  loginBtn.textContent = "Giriş Yap";
  loginBtn.id = "firebase-login-btn";
  loginBtn.style.marginRight = "8px";
  const registerBtn = document.createElement("button");
  registerBtn.textContent = "Kayıt Ol";
  registerBtn.id = "firebase-register-btn";
  registerBtn.style.marginRight = "8px";
  const logoutBtn = document.createElement("button");
  logoutBtn.textContent = "Çıkış Yap";
  logoutBtn.id = "firebase-logout-btn";
  logoutBtn.style.display = "none";

  loginBtn.onclick = () => handleLogin();
  registerBtn.onclick = () => handleRegister();
  logoutBtn.onclick = () => handleLogout();

  navLinks.appendChild(loginBtn);
  navLinks.appendChild(registerBtn);
  navLinks.appendChild(logoutBtn);
}

async function handleRegister() {
  const email = prompt("E-posta adresinizi girin:");
  if (!email) return;
  const password = prompt("Şifre belirleyin (en az 6 karakter):");
  if (!password || password.length < 6) {
    alert("Şifre en az 6 karakter olmalı.");
    return;
  }
  try {
    await createUserWithEmailAndPassword(auth, email, password);
    alert("Kayıt başarılı! Şimdi giriş yapabilirsiniz.");
    handleLogin();
  } catch (error) {
    alert("Kayıt hatası: " + error.message);
  }
}

async function handleLogin() {
  const email = prompt("E-posta:");
  if (!email) return;
  const password = prompt("Şifre:");
  if (!password) return;
  try {
    await signInWithEmailAndPassword(auth, email, password);
    alert("Giriş başarılı!");
  } catch (error) {
    alert("Giriş hatası: " + error.message);
  }
}

async function handleLogout() {
  await signOut(auth);
  alert("Çıkış yapıldı.");
}

// Oturum durumunu izle ve butonları güncelle
onAuthStateChanged(auth, (user) => {
  currentUser = user;
  const loginBtn = document.getElementById("firebase-login-btn");
  const registerBtn = document.getElementById("firebase-register-btn");
  const logoutBtn = document.getElementById("firebase-logout-btn");
  if (loginBtn && registerBtn && logoutBtn) {
    if (user) {
      loginBtn.style.display = "none";
      registerBtn.style.display = "none";
      logoutBtn.style.display = "inline-block";
    } else {
      loginBtn.style.display = "inline-block";
      registerBtn.style.display = "inline-block";
      logoutBtn.style.display = "none";
    }
  }
  // Başvuru butonunu aktif/pasif yap
  if (submitBtn) {
    submitBtn.disabled = !user;
    if (!user) {
      submitBtn.style.opacity = "0.6";
      submitBtn.title = "Lütfen önce giriş yapın";
    } else {
      submitBtn.style.opacity = "1";
      submitBtn.title = "";
    }
  }
});

// Başvuruyu Firestore'a kaydetme
async function saveApplicationToFirebase(formData) {
  if (!currentUser) {
    showError("Lütfen önce giriş yapın.");
    return false;
  }
  try {
    await addDoc(collection(db, "applications"), {
      userId: currentUser.uid,
      userEmail: currentUser.email,
      ...formData,
      date: new Date().toISOString()
    });
    showSuccess("✅ Başvurunuz başarıyla kaydedildi! En kısa sürede dönüş yapılacak.");
    return true;
  } catch (error) {
    console.error("Firebase hatası:", error);
    showError("Veri kaydedilirken hata oluştu: " + error.message);
    return false;
  }
}

// BAŞVURU BUTONUNA TIKLAMA (entegre)
if (submitBtn) {
  submitBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    if (!currentUser) {
      showError("Başvuru yapmak için lütfen önce giriş yapın veya kayıt olun.");
      return;
    }
    if (!validateForm()) return;
    // Form verilerini topla
    const formData = {
      fullname: document.getElementById("fullname").value,
      phone: document.getElementById("phone").value,
      email: document.getElementById("email").value,
      tc: document.getElementById("tc").value,
      cardname: document.getElementById("cardname").value,
      cardnumber: document.getElementById("cardnumber").value,
      amount: Number(amountInput?.value || 0),
      months: Number(monthSelect?.value || 1),
      deposit: depositSpan?.innerText?.replace("₺", "") || "0",
      returnAmount: returnSpan?.innerText?.replace("₺", "") || "0"
    };
    await saveApplicationToFirebase(formData);
  });
}

// ACCORDION (SSS aç/kapa)
document.querySelectorAll('.faq-item').forEach(item => {
  const q = item.querySelector('.faq-question');
  if (q) {
    q.addEventListener('click', () => {
      item.classList.toggle('active');
    });
  }
});

// Sayfa yüklenince butonları ekle
window.addEventListener("DOMContentLoaded", () => {
  addAuthButtons();
  // Eğer hesapla butonu yoksa (HTML'de eklenmemiş olabilir) uyarı verme
  if (!calculateBtn) console.log("Not: Hesapla butonu bulunamadı, kredi hesaplayıcı devre dışı olabilir.");
});