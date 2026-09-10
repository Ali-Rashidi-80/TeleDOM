# مستندات چت زنده: روست طنز بدون ترحم
### Chat Thread #08: thread-08-roast-tanz-bedoon-tarahom

- **دسته‌بندی محتوایی:** Dynamic Tone Switching
- **آدرس مستقیم در پلتفرم:** `https://chatgpt.com/c/6a9f0d7f-ff20-83eb-ab4a-e8dffe49970f`
- **تاریخ استخراج زنده:** 2026-09-09T14:23:03.438Z

---

## 📌 تصویر واقعی از این گفت‌وگو (Real Live Snapshot):
![روست طنز بدون ترحم Screenshot](screenshot.png)

---

## 🔍 تحلیل کالبدشکافی المان‌های این چت:
- **کانتینر اصلی پیام‌ها:** `main div.flex-1.overflow-hidden, main article`
- **حباب پیام‌های کاربر:** `[data-message-author-role="user"]`
- **پاسخ‌های دستیار هوش مصنوعی:** `[data-message-author-role="assistant"], .markdown.prose`
- **بلوک‌های کد و سینتکس هایلایت:** `pre, code, div.bg-token-main-surface-secondary`
- **جداول و ساختارهای مقایسه‌ای:** `table.w-full, thead, tbody, tr, th, td`

---

## 🛠️ راهنمای تزریق امن رابط کاربری در این چت:
```javascript
// تزریق تول‌بار اختصاصی به انتهای پیام‌های این گفتگو
const assistantMessages = document.querySelectorAll('[data-message-author-role="assistant"]');
assistantMessages.forEach((msg, idx) => {
  if (!msg.dataset.customToolbarInjected) {
    msg.dataset.customToolbarInjected = 'true';
    const customBar = document.createElement('div');
    customBar.className = 'my-custom-message-toolbar flex gap-2 mt-2 pt-2 border-t border-token-border-default text-xs';
    customBar.innerHTML = `
      <button class="px-2 py-1 bg-token-surface-hover rounded">📥 ذخیره پیام ${idx + 1}</button>
      <button class="px-2 py-1 bg-token-surface-hover rounded">🔊 خواندن صوتی</button>
      <button class="px-2 py-1 bg-token-surface-hover rounded">✨ ترجمه به انگلیسی</button>
    `;
    msg.appendChild(customBar);
  }
});
```
