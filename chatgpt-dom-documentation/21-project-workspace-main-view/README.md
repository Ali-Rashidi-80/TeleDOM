# مستندات دام: صفحه اصلی فضای کار پروژه (تب گفتگوها) (Project Workspace Main View (Chats Tab))

این پوشه شامل کالبدشکافی کامل معماری DOM، استایل‌های محاسبه‌شده زنده، تصویر باکیفیت و راهنمای تزریق UI برای بخش **صفحه اصلی فضای کار پروژه (تب گفتگوها)** می‌باشد.

---

## 📌 تصویر واقعی از محیط زنده (Real Snapshot):
![Project Workspace Main View (Chats Tab) Screenshot](screenshot.png)

---

## 🎯 سلکتورهای کلیدی (Target Selectors):
- **سلکتور کانتینر اصلی:** `main`
- **سلکتور تحلیل المان:** `main`
- **مختصات و اندازه (Bounding Box):** داینامیک / تمام صفحه

---

## 📝 توضیحات ساختاری و کاربرد:
این بخش نمای عمیق یک پروژه اختصاصی در ChatGPT (پروژه «پرامت نویس حرفه‌ای») را نشان می‌دهد. شامل بنر عنوان پروژه با آیکون فولدر، دکمه‌های اشتراک‌گذاری و منوی آپشن‌ها، فیلد اختصاصی پرامپت با دکمه‌های Think، Mic و Voice، تب‌های دوگانه Chats و Sources، و لیست کامل چت‌های آرشیو شده درون این پروژه با تاریخچه دقیق می‌باشد.

---

## 🛠️ راهنمای تزریق UI سفارشی در اکستنشن کروم (Extension Injection Guide):
```javascript
// تزریق دکمه خروجی اکسل/مارک‌داون چت‌های پروژه در کنار تب‌های Chats و Sources
const tabsContainer = document.querySelector('button[id*="project-home-tabs"]')?.parentElement;
if (tabsContainer && !tabsContainer.dataset.exportBtnInjected) {
  tabsContainer.dataset.exportBtnInjected = 'true';
  const exportBtn = document.createElement('button');
  exportBtn.className = 'btn btn-secondary flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full border border-token-border-default hover:bg-token-main-surface-secondary transition-all';
  exportBtn.innerHTML = '📥 خروجی پروژه (JSON/MD)';
  exportBtn.onclick = () => alert('تمامی چت‌های پروژه با موفقیت استخراج شدند!');
  tabsContainer.appendChild(exportBtn);
}
```

---

## 📁 فایل‌های موجود در این دایرکتوری:
- `screenshot.png`: تصویر باکیفیت و ۱۰۰٪ واقعی از وضعیت زنده المان
- `component.html`: کد کامل DOM زنده استخراج شده از ران‌تایم کروم
- `element_metadata.json`: استایل‌های محاسبه‌شده (Computed Styles)، ویژگی‌های دسترسی‌پذیری (A11y) و ابعاد المان
- `README.md`: مستندات کامل و راهنمای فارسی توسعه و اینجکشن

---
*تولید شده توسط موتور مهندسی معکوس و مستندسازی پیشرفته McpDOM Browser*
