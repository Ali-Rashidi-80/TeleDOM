# 📦 فرم ورودی پرامپت و ادیتور متنی (Bottom Prompt Composer Form & Textarea)

این پوشه حاوی مستندات فنی، ساختار درختی DOM، استایل‌های محاسبه‌شده (Computed Styles) و راهنمای کامل دستکاری و اینجکشن UI برای بخش **فرم ورودی پرامپت و ادیتور متنی** می‌باشد.

---

## 🎯 سلکتورهای هدف (Target CSS Selectors)

- **سلکتور اصلی (Primary Selector):** `#prompt-textarea`
- **سلکتورهای جایگزین (Fallbacks):**
  - `form[data-type="unified-composer"]`
  - `form.group\/composer`
  - `div.composer-parent`

---

## 📋 مشخصات و ساختار فنی (Technical Specifications)


- **تگ والد (HTML Tag):** `<div>`
- **کلاس‌های کلیدی (CSS Classes):** `ProseMirror`
- **نقش معنایی (Role / ARIA):** `textbox`
- **ابعاد و موقعیت (Bounding Box):** `عرض: 525px | ارتفاع: 42px`
- **وضعیت رندرینگ:** `Display: block | Z-Index: auto`


---

## 📝 توضیحات کارکردی این کامپوننت (Overview)

ادیتور متنی شناور پایین صفحه مبتنی بر ProseMirror با قابلیت مالتی‌لاین خودکار، درج کلیدهای میانبر (Enter / Shift+Enter)، نگهدارنده فایل‌های پیوست شده.

---

## 💉 راهنمای تزریق و دستکاری UI در اکستنشن (Extension Injection Guide)

تزریق منوی پاپ‌آپ اتوکامپلیت پرامپت‌ها هنگام تایپ "/"، دکمه‌های متغیرگذاری مانند {{user_name}}، شمارنده توکن‌های ورودی قبل از ارسال، و ادیتور صوتی پیشرفته.

```javascript
// نمونه کد ایمن برای دستکاری یا اینجکت کامپوننت سفارشی
function injectCustomUI() {
  const targetEl = document.querySelector('#prompt-textarea');
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
/* برجسته‌سازی کادر پرامپت هنگام فوکوس */
form[data-type="unified-composer"]:focus-within {
  box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.5), 0 8px 24px rgba(0,0,0,0.4) !important;
}
```

---

## 📁 فایل‌های این بخش:
- `component.html`: کد کامل ساب‌تری دام این المان
- `element_metadata.json`: آبجکت کامل مشخصات، ابعاد و استایل‌های المنت
- `screenshot.png`: اسکرین‌شات برداشته شده از این المان
