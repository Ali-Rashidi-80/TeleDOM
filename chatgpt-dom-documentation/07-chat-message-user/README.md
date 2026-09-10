# 📦 باکس پیام ارسالی کاربر (User Message Bubble & Turn)

این پوشه حاوی مستندات فنی، ساختار درختی DOM، استایل‌های محاسبه‌شده (Computed Styles) و راهنمای کامل دستکاری و اینجکشن UI برای بخش **باکس پیام ارسالی کاربر** می‌باشد.

---

## 🎯 سلکتورهای هدف (Target CSS Selectors)

- **سلکتور اصلی (Primary Selector):** `div[data-message-author-role="user"]`
- **سلکتورهای جایگزین (Fallbacks):**
  - `article:has(.font-user-message)`
  - `div.font-user-message`
  - `div.bg-token-message-surface`

---

## 📋 مشخصات و ساختار فنی (Technical Specifications)


- **تگ والد (HTML Tag):** `<div>`
- **کلاس‌های کلیدی (CSS Classes):** `min-h-8 text-message relative flex w-full flex-col items-end gap-2 text-start break-words whitespace-normal outline-none keyboard-focused:focus-ring [.text-message+&]:mt-1`
- **نقش معنایی (Role / ARIA):** `None`
- **ابعاد و موقعیت (Bounding Box):** `عرض: 768px | ارتفاع: 44px`
- **وضعیت رندرینگ:** `Display: flex | Z-Index: auto`


---

## 📝 توضیحات کارکردی این کامپوننت (Overview)

حباب پیام ارسالی توسط کاربر (با فونت، رنگ پس‌زمینه قرصی شکل تیره، دکمه ویرایش مجدد پرامپت و جهت‌بندی متنی راست‌به‌چپ یا چپ‌به‌راست).

---

## 💉 راهنمای تزریق و دستکاری UI در اکستنشن (Extension Injection Guide)

اضافه کردن دکمه "ذخیره در تمپلیت‌ها"، دکمه "بازنویسی با پرامپت بهتر"، هایلایت‌گذاری پرامپت‌ها و ویرایشگر سریع.

```javascript
// نمونه کد ایمن برای دستکاری یا اینجکت کامپوننت سفارشی
function injectCustomUI() {
  const targetEl = document.querySelector('div[data-message-author-role="user"]');
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
/* استایل حبابی پیام کاربر */
div[data-message-author-role="user"] {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  border-radius: 18px;
}
```

---

## 📁 فایل‌های این بخش:
- `component.html`: کد کامل ساب‌تری دام این المان
- `element_metadata.json`: آبجکت کامل مشخصات، ابعاد و استایل‌های المنت
- `screenshot.png`: اسکرین‌شات برداشته شده از این المان
