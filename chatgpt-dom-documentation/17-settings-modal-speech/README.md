# مستندات دام: 17-settings-modal-speech

این پوشه شامل ساختار کامل DOM، استایل‌های محاسبه‌شده، تصاویر واقعی و راهنمای تزریق UI برای بخش **17-settings-modal-speech** می‌باشد.

---

## 📌 تصویر واقعی از محیط زنده (Real Snapshot):
![17-settings-modal-speech Screenshot](screenshot.png)

---

## 🎯 سلکتورهای کلیدی:
- **سلکتور کانتینر:** `div[data-testid="17-settings-modal-speech"], main, div.stage-layout`
- **مختصات:** Full Component Viewport

---

## 🛠️ راهنمای تزریق UI سفارشی در اکستنشن کروم:
```javascript
const container = document.querySelector('main, div.stage-layout');
if (container && !container.dataset.customInjected) {
  container.dataset.customInjected = 'true';
  const myEl = document.createElement('div');
  myEl.className = 'my-custom-extension-widget';
  myEl.innerHTML = '<span>⚡ ماژول سفارشی فعال شد</span>';
  container.prepend(myEl);
}
```
