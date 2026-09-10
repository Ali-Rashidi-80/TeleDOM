# 📦 کارت پروفایل کاربر در پایین سایدبار (Sidebar User Account Footer Card)

این پوشه حاوی مستندات فنی، ساختار درختی DOM، استایل‌های محاسبه‌شده (Computed Styles) و راهنمای کامل دستکاری و اینجکشن UI برای بخش **کارت پروفایل کاربر در پایین سایدبار** می‌باشد.

---

## 🎯 سلکتورهای هدف (Target CSS Selectors)

- **سلکتور اصلی (Primary Selector):** `div[data-testid="accounts-profile-button"]`
- **سلکتورهای جایگزین (Fallbacks):**
  - `nav div.mb-1\.5`
  - `nav div.mb-1\.5 div[role="button"]`
  - `button:has(div.rounded-full)`

---

## 📋 مشخصات و ساختار فنی (Technical Specifications)


- **تگ والد (HTML Tag):** `<div>`
- **کلاس‌های کلیدی (CSS Classes):** `group __menu-item border-b border-transparent bg-clip-padding hoverable gap-2 transition-colors keyboard-focused:focus-ring keyboard-focused:-outline-offset-2 pe-2`
- **نقش معنایی (Role / ARIA):** `button`
- **ابعاد و موقعیت (Bounding Box):** `عرض: 40px | ارتفاع: 40px`
- **وضعیت رندرینگ:** `Display: flex | Z-Index: auto`


---

## 📝 توضیحات کارکردی این کامپوننت (Overview)

کارت و آواتار پروفایل کاربر در پایین سایدبار (شامل آواتار با حرف م، تریگر منوی پروفایل، دسترسی به پلن و تنظیمات حساب).

---

## 💉 راهنمای تزریق و دستکاری UI در اکستنشن (Extension Injection Guide)

اینجکت کردن نشانگرهای وضعیت اکستنشن، وضعیت مصرف توکن‌های API، یا میانبر مستقیم به تنظیمات پیشرفته اکستنشن در کنار آواتار کاربر.

---

## 🎨 استایل‌های پیشنهادی (Custom CSS Injection)

```css
/* ویجت اختصاصی روی پروفایل کاربر */
div[data-testid="accounts-profile-button"] {
  border-top: 1px solid rgba(255, 255, 255, 0.08) !important;
  margin-top: 8px;
}
```

---

## 📁 فایل‌های این بخش:
- `component.html`: کد کامل ساب‌تری دام این المان
- `element_metadata.json`: آبجکت کامل مشخصات، ابعاد و استایل‌های المنت
- `screenshot.png`: اسکرین‌شات برداشته شده از این المان
