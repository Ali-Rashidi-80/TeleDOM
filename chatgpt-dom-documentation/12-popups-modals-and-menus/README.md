# 📦 مودال‌ها، منوهای کشویی و پاپ‌آپ‌ها (Popups, Modals & Dropdown Overlays)

این پوشه حاوی مستندات فنی، ساختار درختی DOM، استایل‌های محاسبه‌شده (Computed Styles) و راهنمای کامل دستکاری و اینجکشن UI برای بخش **مودال‌ها، منوهای کشویی و پاپ‌آپ‌ها** می‌باشد.

---

## 🎯 سلکتورهای هدف (Target CSS Selectors)

- **سلکتور اصلی (Primary Selector):** `div[role="menu"]`
- **سلکتورهای جایگزین (Fallbacks):**
  - `div[data-radix-popper-content-wrapper]`
  - `div[role="dialog"]`
  - `div.popover`
  - `body > div[data-portal]`

---

## 📋 مشخصات و ساختار فنی (Technical Specifications)

اطلاعات زنده در متادیتا موجود است.

---

## 📝 توضیحات کارکردی این کامپوننت (Overview)

المان‌های شناور و لایه‌های پورتال شامل منوی انتخاب مدل هوش مصنوعی، منوی پیوست فایل‌ها (+)، منوی گزینه‌های چت و پنجره تنظیمات حساب کاربری (Settings Modal).

---

## 💉 راهنمای تزریق و دستکاری UI در اکستنشن (Extension Injection Guide)

استفاده از پورتال‌های React یا درج المان با `position: fixed` و `z-index: 2147483647` برای نمایش پاپ‌آپ‌های سفارشی بدون ایجاد اختلال در پورتال‌های رادیکس (Radix UI) خود ChatGPT.

```javascript
// نمونه کد ایمن برای دستکاری یا اینجکت کامپوننت سفارشی
function injectCustomUI() {
  const targetEl = document.querySelector('div[role="menu"]');
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
/* پاپ‌آپ‌های ایزوله با اولویت لایه بالا */
.my-extension-modal-portal {
  position: fixed;
  z-index: 2147483647;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(8px);
}
```

---

## 📁 فایل‌های این بخش:
- `component.html`: کد کامل ساب‌تری دام این المان
- `element_metadata.json`: آبجکت کامل مشخصات، ابعاد و استایل‌های المنت
- `screenshot.png`: اسکرین‌شات برداشته شده از این المان
