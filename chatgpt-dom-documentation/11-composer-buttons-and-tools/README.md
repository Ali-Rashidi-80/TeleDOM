# 📦 دکمه‌های نوار کامپوزر (پیوست، تفکر، ویس) (Composer Action Buttons & Tools Bar)

این پوشه حاوی مستندات فنی، ساختار درختی DOM، استایل‌های محاسبه‌شده (Computed Styles) و راهنمای کامل دستکاری و اینجکشن UI برای بخش **دکمه‌های نوار کامپوزر (پیوست، تفکر، ویس)** می‌باشد.

---

## 🎯 سلکتورهای هدف (Target CSS Selectors)

- **سلکتور اصلی (Primary Selector):** `div[data-composer-body=""]`
- **سلکتورهای جایگزین (Fallbacks):**
  - `div[data-composer-surface="true"]`
  - `button#composer-plus-btn`
  - `button[aria-label="Start Voice"]`

---

## 📋 مشخصات و ساختار فنی (Technical Specifications)


- **تگ والد (HTML Tag):** `<div>`
- **کلاس‌های کلیدی (CSS Classes):** `row-start-3 row-end-4 col-start-1 col-end-2 min-h-0 min-w-0 flex-1 px-2 py-[9px] group-not-data-expanded/composer:py-[5px] max-sm:group-not-data-expanded/composer:pb-2 grid grid-cols-[auto_1fr_auto] [grid-template-areas:'header_header_header'_'leading_primary_trailing'_'._footer_.'] group-data-expanded/composer:[grid-template-areas:'header_header_header'_'primary_primary_primary'_'leading_footer_trailing'] max-sm:[grid-template-areas:'header_header_header'_'primary_primary_primary'_'leading_footer_trailing']`
- **نقش معنایی (Role / ARIA):** `None`
- **ابعاد و موقعیت (Bounding Box):** `عرض: 768px | ارتفاع: 52px`
- **وضعیت رندرینگ:** `Display: grid | Z-Index: auto`


---

## 📝 توضیحات کارکردی این کامپوننت (Overview)

مجموعه کنترل‌های نوار کامپوزر شامل دکمه افزودن فایل (+) با شناسه composer-plus-btn، دکمه Think، دکمه Dictation و دکمه Start Voice.

---

## 💉 راهنمای تزریق و دستکاری UI در اکستنشن (Extension Injection Guide)

اینجکت دکمه‌های پرامپت آماده، انتخاب قالب خروجی (مثلا JSON / Markdown / Code Only)، و بارگذاری خودکار فایل‌های کانفیگ.

---

## 🎨 استایل‌های پیشنهادی (Custom CSS Injection)

```css
/* دکمه سفارشی اضافه شده به نوار کامپوزر */
.my-composer-addon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #0ea5e9;
  color: white;
  border: none;
  cursor: pointer;
}
```

---

## 📁 فایل‌های این بخش:
- `component.html`: کد کامل ساب‌تری دام این المان
- `element_metadata.json`: آبجکت کامل مشخصات، ابعاد و استایل‌های المنت
- `screenshot.png`: اسکرین‌شات برداشته شده از این المان
