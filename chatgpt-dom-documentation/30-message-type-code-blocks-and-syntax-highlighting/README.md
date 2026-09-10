# مستندات جامع نوع پیام: بلوک‌های کدنویسی و سینتکس هایلایتینگ (Code Blocks)
### Message Architecture: Code Blocks, Syntax Highlighting & Copy Button

این پوشه شامل ساختار کامل DOM، کدهای نمونه، استایل‌های محاسبه‌شده و راهنمای تزریق UI برای انواع پیام‌های **بلوک‌های کدنویسی و سینتکس هایلایتینگ (Code Blocks)** می‌باشد.

---

## 📌 تصویر واقعی از این ساختار محتوایی (Real Snapshot):
![Code Blocks, Syntax Highlighting & Copy Button Screenshot](screenshot.png)

---

## 🔍 کالبدشکافی ساختاری و ویژگی‌ها:
ساختار دقیق کانتینر کدهای برنامه‌نویسی شامل هدر زبان برنامه نویسی (Python, JS, HTML, Rust)، دکمه Copy Code، تگ‌های pre و code با فونت مونو، سیستم رنگ‌بندی توکن‌ها و اسکرول افقی.

---

## 🎯 سلکتورهای کلیدی برای هدف‌گیری در اکستنشن:
- **کانتینر پیام:** `[data-message-author-role="assistant"], article`
- **محتوای پیام:** `.markdown.prose, [data-testid="30-message-type-code-blocks-and-syntax-highlighting"]`
- **بخش اختصاصی محتوا:** `pre, code, table, img, .katex, a.citation`

---

## 🛠️ راهنمای تزریق امن رابط کاربری در اکستنشن کروم:
```javascript
// افزودن دکمه «اجرای مستقیم کد در ران‌تایم» به بالای تمام بلوک‌های کد:
document.querySelectorAll('pre').forEach(pre => {
  if (!pre.dataset.runCodeInjected) {
    pre.dataset.runCodeInjected = 'true';
    const runBtn = document.createElement('button');
    runBtn.className = 'px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 ml-2';
    runBtn.innerHTML = '▶️ اجرای کد';
    runBtn.onclick = () => alert('کد در ران‌تایم امن اجرا شد!');
    pre.querySelector('div.flex.items-center')?.appendChild(runBtn);
  }
});
```

---

## 📁 فایل‌های موجود:
- `screenshot.png`: تصویر باکیفیت و زنده از این نوع پیام
- `component.html`: ساختار کامل DOM زنده استخراج شده
- `element_metadata.json`: استایل‌های محاسبه‌شده، فونت‌ها و ابعاد
- `README.md`: مستندات و راهنمای فارسی توسعه
