# 📦 باکس پاسخ هوش مصنوعی (دستیار) (Assistant Response Message & Markdown Container)

این پوشه حاوی مستندات فنی، ساختار درختی DOM، استایل‌های محاسبه‌شده (Computed Styles) و راهنمای کامل دستکاری و اینجکشن UI برای بخش **باکس پاسخ هوش مصنوعی (دستیار)** می‌باشد.

---

## 🎯 سلکتورهای هدف (Target CSS Selectors)

- **سلکتور اصلی (Primary Selector):** `div[data-message-author-role="assistant"]`
- **سلکتورهای جایگزین (Fallbacks):**
  - `article .markdown.prose`
  - `div.agent-turn`
  - `div.markdown`

---

## 📋 مشخصات و ساختار فنی (Technical Specifications)


- **تگ والد (HTML Tag):** `<div>`
- **کلاس‌های کلیدی (CSS Classes):** `min-h-8 text-message relative flex w-full flex-col items-end gap-2 text-start break-words whitespace-normal outline-none keyboard-focused:focus-ring [.text-message+&]:mt-1`
- **نقش معنایی (Role / ARIA):** `None`
- **ابعاد و موقعیت (Bounding Box):** `عرض: 768px | ارتفاع: 56px`
- **وضعیت رندرینگ:** `Display: flex | Z-Index: auto`


---

## 📝 توضیحات کارکردی این کامپوننت (Overview)

بدنه کامل پاسخ تولید شده توسط ChatGPT شامل آواتار، کانتینر مارک‌داون (.markdown.prose)، رندرهای کد با هایلایت سینتکس، لیست‌ها و متون فارسی.

---

## 💉 راهنمای تزریق و دستکاری UI در اکستنشن (Extension Injection Guide)

اینجکت دکمه "اجرای آنلاین کد" در بالای کدهای Python/JS، اضافه کردن دکمه ارسال پاسخ به Notion/Google Docs، ساخت نمودار خودکار و ترجمه آنی.

```javascript
// نمونه کد ایمن برای دستکاری یا اینجکت کامپوننت سفارشی
function injectCustomUI() {
  const targetEl = document.querySelector('div[data-message-author-role="assistant"]');
  if (!targetEl) return;

  // جلوگیری از اینجکشن تکراری در ری‌رندرهای React
  if (targetEl.dataset.myExtensionInjected) return;
  targetEl.dataset.myExtensionInjected = 'true';

  const customNode = document.createElement('div');
  customNode.className = 'my-custom-chatgpt-addon';
  customNode.innerHTML = `
    <div style="padding: 6px 12px; background: rgba(56, 189, 248, 0.15); border: 1px solid #38bdf8; border-radius: 8px; font-size: 12px; color: #38bdf8; margin: 4px 0;">
      ✨ Custom Extension Injected Widget
    </div>
  `;

  // روش درج: قبل، بعد یا درون المان
  targetEl.insertAdjacentElement('afterbegin', customNode);
}

// ثبت در MutationObserver جهت پایداری بعد از تغییر صفحات و ریدایرکت‌ها
const observer = new MutationObserver(() => {
  injectCustomUI();
});
observer.observe(document.body, { childList: true, subtree: true });
injectCustomUI();
```

---

## 🎨 استایل‌های پیشنهادی (Custom CSS Injection)

```css
/* فونت و فاصله بهینه برای متون فارسی پاسخ */
.markdown.prose {
  line-height: 1.8 !important;
  font-feature-settings: "ss01", "ss02";
}
```

---

## 📁 فایل‌های این بخش:
- `component.html`: کد کامل ساب‌تری دام این المان
- `element_metadata.json`: آبجکت کامل مشخصات، ابعاد و استایل‌های المنت
- `screenshot.png`: اسکرین‌شات برداشته شده از این المان
