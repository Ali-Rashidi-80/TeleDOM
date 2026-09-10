# 📦 بخش چت‌های پین‌شده و تاریخچه (Sidebar Pinned Threads & Conversation History)

این پوشه حاوی مستندات فنی، ساختار درختی DOM، استایل‌های محاسبه‌شده (Computed Styles) و راهنمای کامل دستکاری و اینجکشن UI برای بخش **بخش چت‌های پین‌شده و تاریخچه** می‌باشد.

---

## 🎯 سلکتورهای هدف (Target CSS Selectors)

- **سلکتور اصلی (Primary Selector):** `nav ul:last-of-type`
- **سلکتورهای جایگزین (Fallbacks):**
  - `nav ul:last-of-type`
  - `a[href^="/c/"]`
  - `nav div:has(> a[href^="/c/"])`

---

## 📋 مشخصات و ساختار فنی (Technical Specifications)


- **تگ والد (HTML Tag):** `<ul>`
- **کلاس‌های کلیدی (CSS Classes):** `m-0 list-none p-0`
- **نقش معنایی (Role / ARIA):** `None`
- **ابعاد و موقعیت (Bounding Box):** `عرض: 246px | ارتفاع: 72px`
- **وضعیت رندرینگ:** `Display: block | Z-Index: auto`


---

## 📝 توضیحات کارکردی این کامپوننت (Overview)

لیست گفتگوهای سنجاق‌شده (Pinned) و تایم‌لاین چت‌های قبلی با عنوان فارسی/انگلیسی و دکمه سه نقطه مدیریت هر چت.

---

## 💉 راهنمای تزریق و دستکاری UI در اکستنشن (Extension Injection Guide)

مناسب برای اضافه کردن پوشه‌بندی چت‌ها (Folders/Categories)، قابلیت پین کردن نامحدود، جستجوی بلادرنگ در تاریخچه چت‌ها، و دانلود گروهی گفتگوها.

```javascript
// نمونه کد ایمن برای دستکاری یا اینجکت کامپوننت سفارشی
function injectCustomUI() {
  const targetEl = document.querySelector('nav ul:last-of-type');
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
/* هایلایت چت‌های دارای تگ اختصاصی */
a[href^="/c/"][data-favorite="true"] {
  border-left: 3px solid #38bdf8;
  background: rgba(56, 189, 248, 0.05);
}
```

---

## 📁 فایل‌های این بخش:
- `component.html`: کد کامل ساب‌تری دام این المان
- `element_metadata.json`: آبجکت کامل مشخصات، ابعاد و استایل‌های المنت
- `screenshot.png`: اسکرین‌شات برداشته شده از این المان
