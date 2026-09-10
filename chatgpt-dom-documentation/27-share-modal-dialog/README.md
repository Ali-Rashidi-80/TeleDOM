# مستندات دام: مدال اشتراک‌گذاری گفت‌وگو و پروژه (Share Modal Dialog) (Share Modal Dialog & Access Permissions)

این پوشه شامل کالبدشکافی کامل معماری DOM، استایل‌های محاسبه‌شده زنده، تصویر باکیفیت و راهنمای تزریق UI برای بخش **مدال اشتراک‌گذاری گفت‌وگو و پروژه (Share Modal Dialog)** می‌باشد.

---

## 📌 تصویر واقعی از محیط زنده (Real Snapshot):
![Share Modal Dialog & Access Permissions Screenshot](screenshot.png)

---

## 🎯 سلکتورهای کلیدی (Target Selectors):
- **سلکتور کانتینر اصلی:** `div[role="dialog"]`
- **سلکتور تحلیل المان:** `div[role="dialog"]`
- **مختصات و اندازه (Bounding Box):** داینامیک / تمام صفحه

---

## 📝 توضیحات ساختاری و کاربرد:
این بخش پنجره دیالوگ اشتراک‌گذاری عمومی/سازمانی گفت‌وگو و پروژه‌ها را نشان می‌دهد. شامل لینک اشتراک‌گذاری مستقیم، دکمه کپی لینک، تنظیمات نام و عکس پروفایل در لینک اشتراکی، و امکان لغو یا مدیریت پیوند‌های فعال می‌باشد.

---

## 🛠️ راهنمای تزریق UI سفارشی در اکستنشن کروم (Extension Injection Guide):
```javascript
// تزریق گزینه اشتراک مستقیم در توییتر/لینکدین به مدال Share
const shareDialogFooter = document.querySelector('div[role="dialog"] .flex.items-center.justify-between, div[role="dialog"] footer');
if (shareDialogFooter && !shareDialogFooter.dataset.socialShareInjected) {
  shareDialogFooter.dataset.socialShareInjected = 'true';
  const socialBtn = document.createElement('button');
  socialBtn.className = 'btn btn-secondary px-3 py-1.5 text-xs rounded-lg flex items-center gap-1 bg-token-main-surface-secondary';
  socialBtn.innerHTML = '🔗 اشتراک در شبکه‌های اجتماعی';
  socialBtn.onclick = () => alert('پنجره اشتراک فوری باز شد');
  shareDialogFooter.prepend(socialBtn);
}
```

---

## 📁 فایل‌های موجود در این دایرکتوری:
- `screenshot.png`: تصویر باکیفیت و ۱۰۰٪ واقعی از وضعیت زنده المان
- `component.html`: کد کامل DOM زنده استخراج شده از ران‌تایم کروم
- `element_metadata.json`: استایل‌های محاسبه‌شده (Computed Styles)، ویژگی‌های دسترسی‌پذیری (A11y) و ابعاد المان
- `README.md`: مستندات کامل و راهنمای فارسی توسعه و اینجکشن

---
*تولید شده توسط موتور مهندسی معکوس و مستندسازی پیشرفته McpDOM Browser*
