# 📦 هدر چسبان بالای صفحه چت (Top Sticky Header & Model Bar)

این پوشه حاوی مستندات فنی، ساختار درختی DOM، استایل‌های محاسبه‌شده (Computed Styles) و راهنمای کامل دستکاری و اینجکشن UI برای بخش **هدر چسبان بالای صفحه چت** می‌باشد.

---

## 🎯 سلکتورهای هدف (Target CSS Selectors)

- **سلکتور اصلی (Primary Selector):** `header`
- **سلکتورهای جایگزین (Fallbacks):**
  - `div.sticky.top-0`
  - `#main > div:first-child > div:first-child`

---

## 📋 مشخصات و ساختار فنی (Technical Specifications)


- **تگ والد (HTML Tag):** `<header>`
- **کلاس‌های کلیدی (CSS Classes):** `draggable no-draggable-children sticky top-0 p-2 touch:p-2.5 flex items-center justify-between z-20 h-header-height bg-transparent! shadow-none! pointer-events-none select-none [view-transition-name:var(--vt-page-header)] *:pointer-events-auto transition-none motion-safe:transition-none data-[fixed-header=less-than-xl]:@w-xl/main:bg-transparent data-[fixed-header=less-than-xl]:@w-xl/main:shadow-none!`
- **نقش معنایی (Role / ARIA):** `banner`
- **ابعاد و موقعیت (Bounding Box):** `عرض: 1109px | ارتفاع: 52px`
- **وضعیت رندرینگ:** `Display: flex | Z-Index: 20`


---

## 📝 توضیحات کارکردی این کامپوننت (Overview)

نوار بالای محیط چت شامل سلکتور مدل جاری (ChatGPT / GPT-4o)، دکمه Upgrade، دکمه Share برای اشتراک لینک گفتگو و دکمه سه نقطه گزینه‌های چت.

---

## 💉 راهنمای تزریق و دستکاری UI در اکستنشن (Extension Injection Guide)

محل ایده‌آل برای اینجکت کردن نوار ابزار اصلی اکستنشن، دکمه خروجی PDF/Markdown، شمارنده کلمات پیام جاری، و دکمه ترجمه سراسری.

```javascript
// نمونه کد ایمن برای دستکاری یا اینجکت کامپوننت سفارشی
function injectCustomUI() {
  const targetEl = document.querySelector('header');
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
/* نوار ابزار اختصاصی اکستنشن در هدر چت */
.my-header-extension-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
  padding-right: 12px;
}
```

---

## 📁 فایل‌های این بخش:
- `component.html`: کد کامل ساب‌تری دام این المان
- `element_metadata.json`: آبجکت کامل مشخصات، ابعاد و استایل‌های المنت
- `screenshot.png`: اسکرین‌شات برداشته شده از این المان
