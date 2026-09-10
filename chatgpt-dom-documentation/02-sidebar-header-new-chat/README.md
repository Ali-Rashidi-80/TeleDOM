# 📦 هدر سایدبار و دکمه چت جدید (Sidebar Header & New Chat Action)

این پوشه حاوی مستندات فنی، ساختار درختی DOM، استایل‌های محاسبه‌شده (Computed Styles) و راهنمای کامل دستکاری و اینجکشن UI برای بخش **هدر سایدبار و دکمه چت جدید** می‌باشد.

---

## 🎯 سلکتورهای هدف (Target CSS Selectors)

- **سلکتور اصلی (Primary Selector):** `nav a[href="/"]`
- **سلکتورهای جایگزین (Fallbacks):**
  - `button[data-testid="new-chat-button"]`
  - `button[aria-label="New chat"]`
  - `nav > div:first-child`

---

## 📋 مشخصات و ساختار فنی (Technical Specifications)


- **تگ والد (HTML Tag):** `<a>`
- **کلاس‌های کلیدی (CSS Classes):** `group __menu-item border-b border-transparent bg-clip-padding hoverable gap-1.5 transition-colors keyboard-focused:focus-ring keyboard-focused:-outline-offset-2 touch:size-10 mx-2 size-9 justify-center p-0`
- **نقش معنایی (Role / ARIA):** `link`
- **ابعاد و موقعیت (Bounding Box):** `عرض: 36px | ارتفاع: 36px`
- **وضعیت رندرینگ:** `Display: flex | Z-Index: auto`


---

## 📝 توضیحات کارکردی این کامپوننت (Overview)

قسمت بالای سایدبار که شامل لوگوی ChatGPT، دکمه بستن سایدبار (Collapse Sidebar) و دکمه شروع چت جدید (New chat) و جستجو است.

---

## 💉 راهنمای تزریق و دستکاری UI در اکستنشن (Extension Injection Guide)

بهترین مکان برای اینجکت کردن دکمه‌های دسترسی سریع مثل "چت جدید با تمپلیت خاص"، دکمه "پاکسازی کش" یا "انتخاب‌گر پرامپت‌های سازمانی".

```javascript
// نمونه کد ایمن برای دستکاری یا اینجکت کامپوننت سفارشی
function injectCustomUI() {
  const targetEl = document.querySelector('nav a[href="/"]');
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
/* دکمه اختصاصی در هدر سایدبار */
.my-quick-template-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #1e293b;
  color: #38bdf8;
  border-radius: 8px;
  padding: 6px 12px;
  cursor: pointer;
}
```

---

## 📁 فایل‌های این بخش:
- `component.html`: کد کامل ساب‌تری دام این المان
- `element_metadata.json`: آبجکت کامل مشخصات، ابعاد و استایل‌های المنت
- `screenshot.png`: اسکرین‌شات برداشته شده از این المان
