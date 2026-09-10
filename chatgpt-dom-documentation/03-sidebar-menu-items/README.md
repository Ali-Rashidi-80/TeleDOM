# 📦 آیتم‌های منوی سایدبار (Sidebar Menu Items (Images, Library, Codex))

این پوشه حاوی مستندات فنی، ساختار درختی DOM، استایل‌های محاسبه‌شده (Computed Styles) و راهنمای کامل دستکاری و اینجکشن UI برای بخش **آیتم‌های منوی سایدبار** می‌باشد.

---

## 🎯 سلکتورهای هدف (Target CSS Selectors)

- **سلکتور اصلی (Primary Selector):** `nav a[href="/images"]`
- **سلکتورهای جایگزین (Fallbacks):**
  - `nav a[href="/library"]`
  - `nav a[href="/codex"]`
  - `nav ul:first-of-type`

---

## 📋 مشخصات و ساختار فنی (Technical Specifications)


- **تگ والد (HTML Tag):** `<a>`
- **کلاس‌های کلیدی (CSS Classes):** `group __menu-item border-b border-transparent bg-clip-padding hoverable gap-1.5 transition-colors keyboard-focused:focus-ring keyboard-focused:-outline-offset-2 touch:size-10 mx-2 size-9 justify-center p-0`
- **نقش معنایی (Role / ARIA):** `link`
- **ابعاد و موقعیت (Bounding Box):** `عرض: 36px | ارتفاع: 36px`
- **وضعیت رندرینگ:** `Display: flex | Z-Index: auto`


---

## 📝 توضیحات کارکردی این کامپوننت (Overview)

منوی ابزارهای پیشرفته ChatGPT شامل بخش‌های Images (با بج UPDATED)، Library، Scheduled، Plugins، Projects و Codex.

---

## 💉 راهنمای تزریق و دستکاری UI در اکستنشن (Extension Injection Guide)

می‌توانید آیتم‌های جدید با آیکون دلخواه خود (مثلا "My AI Tools" یا "Export Center") دقیقا با فرمت و ساختار SVG های خود ChatGPT در این لیست تزریق کنید.

```javascript
// نمونه کد ایمن برای دستکاری یا اینجکت کامپوننت سفارشی
function injectCustomUI() {
  const targetEl = document.querySelector('nav a[href="/images"]');
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
/* استایل آیتم منوی اکستنشن همگام با منوهای چت‌جی‌پی‌تی */
.my-custom-menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border-radius: 8px;
  color: #ececf1;
  text-decoration: none;
  transition: background 0.15s ease;
}
.my-custom-menu-item:hover {
  background: rgba(255, 255, 255, 0.08);
}
```

---

## 📁 فایل‌های این بخش:
- `component.html`: کد کامل ساب‌تری دام این المان
- `element_metadata.json`: آبجکت کامل مشخصات، ابعاد و استایل‌های المنت
- `screenshot.png`: اسکرین‌شات برداشته شده از این المان
