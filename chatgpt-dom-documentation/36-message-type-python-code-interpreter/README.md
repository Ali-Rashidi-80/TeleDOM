# مستندات جامع نوع پیام: محیط اجرای پایتون و خروجی‌های تحلیلی (Code Interpreter)
### Message Architecture: Python Execution Environment, Terminal & Matplotlib Plots

این پوشه شامل ساختار کامل DOM، کدهای نمونه، استایل‌های محاسبه‌شده و راهنمای تزریق UI برای انواع پیام‌های **محیط اجرای پایتون و خروجی‌های تحلیلی (Code Interpreter)** می‌باشد.

---

## 📌 تصویر واقعی از این ساختار محتوایی (Real Snapshot):
![Python Execution Environment, Terminal & Matplotlib Plots Screenshot](screenshot.png)

---

## 🔍 کالبدشکافی ساختاری و ویژگی‌ها:
ساختار کارت‌های Advanced Data Analysis (محیط ایزوله پایتون)، بلوک‌های ورودی کد، پنجره خروجی ترمینال استریم، و نمودارهای رندر شده با Matplotlib/Seaborn.

---

## 🎯 سلکتورهای کلیدی برای هدف‌گیری در اکستنشن:
- **کانتینر پیام:** `[data-message-author-role="assistant"], article`
- **محتوای پیام:** `.markdown.prose, [data-testid="36-message-type-python-code-interpreter"]`
- **بخش اختصاصی محتوا:** `pre, code, table, img, .katex, a.citation`

---

## 🛠️ راهنمای تزریق امن رابط کاربری در اکستنشن کروم:
```javascript
// استخراج خودکار کد پایتون و نمودارهای رسم‌شده:
const pyOutputs = document.querySelectorAll('.code-interpreter-output');
```

---

## 📁 فایل‌های موجود:
- `screenshot.png`: تصویر باکیفیت و زنده از این نوع پیام
- `component.html`: ساختار کامل DOM زنده استخراج شده
- `element_metadata.json`: استایل‌های محاسبه‌شده، فونت‌ها و ابعاد
- `README.md`: مستندات و راهنمای فارسی توسعه
