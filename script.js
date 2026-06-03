// ----- Kredi hesaplayıcı (otomatik düzeltme yok, sadece uyarı) -----
const amountInput = document.getElementById("amount");
const monthSelect = document.getElementById("month");
const depositSpan = document.getElementById("deposit");
const returnSpan = document.getElementById("return");
const amountError = document.getElementById("amountError");

let isValidAmount = true;

function calculate() {
  let rawValue = amountInput.value.trim();
  if (rawValue === "") {
    amountError.innerText = "Lütfen bir tutar girin.";
    isValidAmount = false;
    depositSpan.innerText = "0₺";
    returnSpan.innerText = "0₺";
    return;
  }
  let value = Number(rawValue);
  if (isNaN(value) || value < 1000) {
    amountError.innerText = "⚠️ Minimum kredi tutarı 1000₺'dir.";
    isValidAmount = false;
    depositSpan.innerText = "0₺";
    returnSpan.innerText = "0₺";
    return;
  }
  amountError.innerText = "";
  isValidAmount = true;
  
  const depositValue = value * 0.10;
  let returnValue = value;
  if (monthSelect.value === "2") returnValue = value * 1.10;
  if (monthSelect.value === "3") returnValue = value * 1.15;
  
  depositSpan.innerText = `${Math.round(depositValue)}₺`;
  returnSpan.innerText = `${Math.round(returnValue)}₺`;
}

amountInput.addEventListener("input", calculate);
monthSelect.addEventListener("change", calculate);
calculate();

// ----- Başvuru formu doğrulama -----
const submitBtn = document.getElementById("submitApplication");
const successBox = document.getElementById("successMessage");
const errorBox = document.getElementById("errorMessage");

function showError(msg) {
  errorBox.style.display = "block";
  errorBox.innerText = msg;
  successBox.style.display = "none";
  setTimeout(() => {
    errorBox.style.display = "none";
  }, 5000);
}

function showSuccess() {
  successBox.style.display = "block";
  errorBox.style.display = "none";
  // Formu temizle (opsiyonel)
  document.getElementById("fullname").value = "";
  document.getElementById("phone").value = "";
  document.getElementById("email").value = "";
  document.getElementById("tc").value = "";
  document.getElementById("cardname").value = "";
  document.getElementById("cardnumber").value = "";
  document.getElementById("depositSlip").value = "";
}

function validateForm() {
  const fullname = document.getElementById("fullname").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const email = document.getElementById("email").value.trim();
  const tc = document.getElementById("tc").value.trim();
  const cardname = document.getElementById("cardname").value.trim();
  const cardnumber = document.getElementById("cardnumber").value.trim();
  const fileInput = document.getElementById("depositSlip");

  if (!fullname) return showError("Ad soyad giriniz.");
  if (!phone) return showError("Telefon numarası giriniz.");
  if (!email || !email.includes("@")) return showError("Geçerli e-posta adresi giriniz.");
  if (!tc || tc.length !== 11 || isNaN(tc)) return showError("TC Kimlik No 11 haneli olmalıdır.");
  if (!cardname) return showError("Kart sahibi ismi giriniz.");
  if (!cardnumber || cardnumber.replace(/\s/g, '').length < 4) return showError("Kart numarası (son 4 hane) giriniz.");
  if (!fileInput.files.length) return showError("Deposit dekontunu yükleyin.");
  
  return true;
}

submitBtn.addEventListener("click", (e) => {
  e.preventDefault();
  if (!isValidAmount) {
    showError("Lütfen geçerli bir kredi tutarı girin (minimum 1000₺).");
    return;
  }
  if (validateForm()) {
    showSuccess();
  }
});

// ----- Accordion (SSS) -----
document.querySelectorAll('.faq-item').forEach(item => {
  const question = item.querySelector('.faq-question');
  question.addEventListener('click', () => {
    // Açılanı kapatıp diğerlerini kapatmak isterseniz aşağıdaki satırları aktif edin.
    // Şu an her soru bağımsız açılıp kapanıyor.
    item.classList.toggle('active');
    /*
    // Sadece bir soru açık kalsın isterseniz:
    document.querySelectorAll('.faq-item').forEach(other => {
      if (other !== item) other.classList.remove('active');
    });
    */
  });
});