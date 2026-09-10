# 📦 کانتینر اصلی سایدبار چپ (Main Sidebar Navigation Container)

این پوشه حاوی مستندات فنی، ساختار درختی DOM، استایل‌های محاسبه‌شده (Computed Styles) و راهنمای کامل دستکاری و اینجکشن UI برای بخش **کانتینر اصلی سایدبار چپ** می‌باشد.

---

## 🎯 سلکتورهای هدف (Target CSS Selectors)

- **سلکتور اصلی (Primary Selector):** `nav[aria-label="Chat history"]`
- **سلکتورهای جایگزین (Fallbacks):**
  - `aside`
  - `div.bg-token-sidebar-surface-primary`
  - `#stage-slideout`

---

## 📋 مشخصات و ساختار فنی (Technical Specifications)


- **تگ والد (HTML Tag):** `<nav>`
- **کلاس‌های کلیدی (CSS Classes):** `group/scrollport relative flex min-h-0 w-full flex-1 flex-col overflow-y-auto`
- **نقش معنایی (Role / ARIA):** `navigation`
- **ابعاد و موقعیت (Bounding Box):** `عرض: 260px | ارتفاع: 597px`
- **وضعیت رندرینگ:** `Display: flex | Z-Index: auto`


---

## 📝 توضیحات کارکردی این کامپوننت (Overview)

کانتینر اصلی نوار کناری چپ ChatGPT که شامل دکمه چت جدید، منوهای اصلی، تاریخچه چت‌های پین‌شده و اخیر، و پروفایل کاربری در پایین است.

---

## 💉 راهنمای تزریق و دستکاری UI در اکستنشن (Extension Injection Guide)

برای اضافه کردن تب‌های سفارشی، سایدبارهای کشویی جدید، یا دکمه‌های ناوبری ویژه می‌توان از این کانتینر استفاده کرد. توصیه می‌شود از Shadow DOM یا استایل‌های ایزوله استفاده کنید تا تغییر تم‌های لایت/دارک ChatGPT ظاهر اکستنشن شما را به هم نریزد.

```javascript
// نمونه کد ایمن برای دستکاری یا اینجکت کامپوننت سفارشی
function injectCustomUI() {
  const targetEl = document.querySelector('nav[aria-label="Chat history"]');
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
/* سفارشی سازی ظاهر سایدبار */
nav[aria-label="Chat history"] {
  border-right: 1px solid rgba(255, 255, 255, 0.08) !important;
}
```

---

## 📁 فایل‌های این بخش:
- `component.html`: کد کامل ساب‌تری دام این المان
- `element_metadata.json`: آبجکت کامل مشخصات، ابعاد و استایل‌های المنت
- `screenshot.png`: اسکرین‌شات برداشته شده از این المان
