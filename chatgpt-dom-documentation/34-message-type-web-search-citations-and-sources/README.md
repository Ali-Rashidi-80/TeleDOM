# مستندات جامع نوع پیام: نتایج جستجوی وب، منابع و نقل‌قول‌ها (Web Search Citations)
### Message Architecture: Web Search Citations, Source Links & Favicon Badges

این پوشه شامل ساختار کامل DOM، کدهای نمونه، استایل‌های محاسبه‌شده و راهنمای تزریق UI برای انواع پیام‌های **نتایج جستجوی وب، منابع و نقل‌قول‌ها (Web Search Citations)** می‌باشد.

---

## 📌 تصویر واقعی از این ساختار محتوایی (Real Snapshot):
![Web Search Citations, Source Links & Favicon Badges Screenshot](screenshot.png)

---

## 🔍 کالبدشکافی ساختاری و ویژگی‌ها:
ساختار کارت‌های منابع جستجوی وب (Search with Bing/Google)، بج‌های نقل‌قول (Citations a.citation)، فاوآیکون سایت‌های منبع و منوی دراپ‌داون لیست تمام لینک‌های ارجاع.

---

## 🎯 سلکتورهای کلیدی برای هدف‌گیری در اکستنشن:
- **کانتینر پیام:** `[data-message-author-role="assistant"], article`
- **محتوای پیام:** `.markdown.prose, [data-testid="34-message-type-web-search-citations-and-sources"]`
- **بخش اختصاصی محتوا:** `pre, code, table, img, .katex, a.citation`

---

## 🛠️ راهنمای تزریق امن رابط کاربری در اکستنشن کروم:
```javascript
// هایلایت کردن منابع معتبر دانشگاهی و فنی در نقل‌قول‌های وب:
document.querySelectorAll('a.citation, [data-testid*="citation"]').forEach(cite => {
  cite.style.borderBottom = '2px solid #3b82f6';
  cite.title = 'منبع موثق وب تأیید شد';
});
```

---

## 📁 فایل‌های موجود:
- `screenshot.png`: تصویر باکیفیت و زنده از این نوع پیام
- `component.html`: ساختار کامل DOM زنده استخراج شده
- `element_metadata.json`: استایل‌های محاسبه‌شده، فونت‌ها و ابعاد
- `README.md`: مستندات و راهنمای فارسی توسعه
