# مستندات جامع نوع پیام: نوار ابزار اکشن‌های پاسخ و وضعیت هاور (Response Action Toolbar)
### Message Architecture: Action Toolbar (Copy, Up/Down Vote, Read Aloud, Regenerate)

این پوشه شامل ساختار کامل DOM، کدهای نمونه، استایل‌های محاسبه‌شده و راهنمای تزریق UI برای انواع پیام‌های **نوار ابزار اکشن‌های پاسخ و وضعیت هاور (Response Action Toolbar)** می‌باشد.

---

## 📌 تصویر واقعی از این ساختار محتوایی (Real Snapshot):
![Action Toolbar (Copy, Up/Down Vote, Read Aloud, Regenerate) Screenshot](screenshot.png)

---

## 🔍 کالبدشکافی ساختاری و ویژگی‌ها:
کالبدشکافی نوار ابزار پایین هر پاسخ دستیار شامل دکمه‌های کپی متنی، لایک/دیس‌لایک، بلندگوی صوتی (Read Aloud)، دکمه تلاش مجدد (Regenerate) و تریگرهای منوی ۳ نقطه.

---

## 🎯 سلکتورهای کلیدی برای هدف‌گیری در اکستنشن:
- **کانتینر پیام:** `[data-message-author-role="assistant"], article`
- **محتوای پیام:** `.markdown.prose, [data-testid="39-message-type-response-action-toolbar"]`
- **بخش اختصاصی محتوا:** `pre, code, table, img, .katex, a.citation`

---

## 🛠️ راهنمای تزریق امن رابط کاربری در اکستنشن کروم:
```javascript
// افزودن دکمه اشتراک فوری به نوار ابزار پاسخ‌ها:
```

---

## 📁 فایل‌های موجود:
- `screenshot.png`: تصویر باکیفیت و زنده از این نوع پیام
- `component.html`: ساختار کامل DOM زنده استخراج شده
- `element_metadata.json`: استایل‌های محاسبه‌شده، فونت‌ها و ابعاد
- `README.md`: مستندات و راهنمای فارسی توسعه
