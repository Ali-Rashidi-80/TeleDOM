# مستندات جامع نوع پیام: پیوست فایل‌ها، اسناد PDF و چیپ‌های دانلودی (File Attachments)
### Message Architecture: File Attachments, PDF Chips & Document Badges

این پوشه شامل ساختار کامل DOM، کدهای نمونه، استایل‌های محاسبه‌شده و راهنمای تزریق UI برای انواع پیام‌های **پیوست فایل‌ها، اسناد PDF و چیپ‌های دانلودی (File Attachments)** می‌باشد.

---

## 📌 تصویر واقعی از این ساختار محتوایی (Real Snapshot):
![File Attachments, PDF Chips & Document Badges Screenshot](screenshot.png)

---

## 🔍 کالبدشکافی ساختاری و ویژگی‌ها:
ساختار چیپ‌های فایل بارگذاری شده توسط کاربر (اسناد PDF، اکسل، CSV، فایل‌های متنی)، آیکون نوع فایل، نام و حجم فایل، دکمه حذف و پیش‌نمایش در مرورگر.

---

## 🎯 سلکتورهای کلیدی برای هدف‌گیری در اکستنشن:
- **کانتینر پیام:** `[data-message-author-role="assistant"], article`
- **محتوای پیام:** `.markdown.prose, [data-testid="33-message-type-file-attachments-and-chips"]`
- **بخش اختصاصی محتوا:** `pre, code, table, img, .katex, a.citation`

---

## 🛠️ راهنمای تزریق امن رابط کاربری در اکستنشن کروم:
```javascript
// افزودن قابلیت پیش‌نمایش متن فایل در یک مودال اختصاصی:
document.querySelectorAll('[data-testid*="attachment"], .attachment-chip').forEach(chip => {
  chip.onclick = () => console.log('پیش‌نمایش سند فعال شد');
});
```

---

## 📁 فایل‌های موجود:
- `screenshot.png`: تصویر باکیفیت و زنده از این نوع پیام
- `component.html`: ساختار کامل DOM زنده استخراج شده
- `element_metadata.json`: استایل‌های محاسبه‌شده، فونت‌ها و ابعاد
- `README.md`: مستندات و راهنمای فارسی توسعه
