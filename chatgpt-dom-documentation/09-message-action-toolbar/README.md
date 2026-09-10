# 📦 نوار ابزار اکشن‌های پیام دستیار (Assistant Message Action Toolbar (Copy, Share, Retry))

این پوشه حاوی مستندات فنی، ساختار درختی DOM، استایل‌های محاسبه‌شده (Computed Styles) و راهنمای کامل دستکاری و اینجکشن UI برای بخش **نوار ابزار اکشن‌های پیام دستیار** می‌باشد.

---

## 🎯 سلکتورهای هدف (Target CSS Selectors)

- **سلکتور اصلی (Primary Selector):** `div[aria-label="Response actions"]`
- **سلکتورهای جایگزین (Fallbacks):**
  - `button[data-testid="copy-turn-action-button"]`
  - `div.min-h-\[46px\]`

---

## 📋 مشخصات و ساختار فنی (Technical Specifications)


- **تگ والد (HTML Tag):** `<div>`
- **کلاس‌های کلیدی (CSS Classes):** `touch:-me-2 touch:-ms-3.5 -ms-2.5 -me-1 flex flex-wrap items-center gap-y-4 p-1 select-none -mt-1 touch:w-[calc(100%+--spacing(3.5))] w-[calc(100%+--spacing(2.5))] duration-[1.5s] focus-within:transition-none hover:transition-none touch:pointer-events-auto cant-hover:pointer-events-auto pointer-events-none [mask-image:linear-gradient(to_right,black_33%,transparent_66%)] [mask-size:300%_100%] [mask-position:100%_0%] motion-safe:transition-[mask-position] group-hover/turn-messages:pointer-events-auto group-hover/turn-messages:[mask-position:0_0] group-focus-within/turn-messages:pointer-events-auto group-focus-within/turn-messages:[mask-position:0_0] has-data-[state=open]:pointer-events-auto has-data-[state=open]:[mask-position:0_0]`
- **نقش معنایی (Role / ARIA):** `group`
- **ابعاد و موقعیت (Bounding Box):** `عرض: 778px | ارتفاع: 50px`
- **وضعیت رندرینگ:** `Display: flex | Z-Index: auto`


---

## 📝 توضیحات کارکردی این کامپوننت (Overview)

نوار ابزار زیر هر پاسخ چت‌جی‌پی‌تی شامل دکمه‌های Copy، Thumbs Up/Down، Read Aloud، Regenerate و اشتراک‌گذاری.

---

## 💉 راهنمای تزریق و دستکاری UI در اکستنشن (Extension Injection Guide)

بهترین نقطه برای تزریق دکمه‌های سفارشی مانند "ذخیره در Obsidian"، "کپی به صورت Markdown کامل"، "ارسال به webhook" و "تولید فایل صوتی با هوش مصنوعی".

---

## 🎨 استایل‌های پیشنهادی (Custom CSS Injection)

```css
/* دکمه اختصاصی در نوار ابزار پیام */
div[aria-label="Response actions"] .my-tool-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.05);
  color: #94a3b8;
  font-size: 12px;
  cursor: pointer;
}
```

---

## 📁 فایل‌های این بخش:
- `component.html`: کد کامل ساب‌تری دام این المان
- `element_metadata.json`: آبجکت کامل مشخصات، ابعاد و استایل‌های المنت
- `screenshot.png`: اسکرین‌شات برداشته شده از این المان
