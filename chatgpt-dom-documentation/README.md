# 🏛️ مستندات جامع و کالبدشکافی کامل DOM و کامپوننت‌های ChatGPT
## ChatGPT Complete DOM Architecture, UI Reverse-Engineering & Extension Injection Guide

این مخزن شامل کامل‌ترین، دقیق‌ترین و عمیق‌ترین مستندات کالبدشکافی رابط کاربری پلتفرم **ChatGPT (OpenAI)** بر پایه استخراج زنده (Live DOM Extraction) توسط ابزار اختصاصی **McpDOM-Browser** می‌باشد.

تمام بخش‌ها، زیرمنوها، دیالوگ‌های عمیق تنظیمات، فضاهای کاری پروژه‌ها، **۳۰ گفت‌وگوی واقعی با محتوای سنگین**، **۱۲ الگوی جامع انواع پیام‌ها** و **ماژول‌های اختصاصی سرچ، فیلتر، میکروفون ویس و پلیر صوتی Read Aloud** با اسکرین‌شات‌های پیکسلی، کدهای کامل DOM، متادیتا و اسنیپت‌های تزریق اکستنشن مستندسازی شده‌اند.

---

## 📊 آمار کل پکیج مستندات (Comprehensive Statistics):
- **تعداد کل ماژول‌ها و دایرکتوری‌های کالبدشکافی شده:** **۸۸ ماژول مستقل**
  - **ماژول‌های پایه و ساختار اصلی UI:** ۲۹ ماژول (`00` تا `28`)
  - **تب‌های کامل و عمیق منوی تنظیمات (Settings Tabs):** ۱۳ تب اختصاصی (`12` تا `24`)
  - **فضای کاری پروژه‌ها و ناوبری پیشرفته:** ۵ ماژول (`25` تا `28`)
  - **پکیج کرپوس ۳۰ گفت‌وگوی واقعی کاربر (30-Chat Corpus):** ۳۰ چت کامل (`thread-01` تا `thread-30`)
  - **کاتالوگ اختصاصی ۱۲ الگوی جامع پیام‌ها (Universal Message Types):** ۱۲ ماژول (`30` تا `41`)
  - **ماژول‌های اختصاصی سرچ، فیلتر، ویس و پلیر صوتی (Search, Filter, Voice, TTS Player):** ۴ ماژول (`42` تا `45`)
- **تصاویر و اسکرین‌شات‌ها:** ۱۰۰٪ تصاویر واقعی، زنده و گرفته‌شده از محیط مرورگر با ابعاد کامل
- **فایل‌های کدهای DOM:** بیش از ۸۸ فایل `component.html` با ساختار کامل تگ‌ها و کلاس‌های Tailwind/Custom
- **متادیتای محاسباتی:** ۸۸ فایل `element_metadata.json` شامل مختصات، ابعاد، رنگ‌ها، فونت‌ها و وضعیت‌های تعاملی

---

## 🗂️ فهرست ساختار ماژول‌ها و کامپوننت‌های مستند شده:

### بخش اول: ساختار اصلی پلتفرم و لایه‌های پایه (Core Architecture & Base Layers)
1. [`00-master-architecture-and-full-dom`](00-master-architecture-and-full-dom/README.md) - معماری کل پلتفرم و دام کامل صفحه اصلی
2. [`01-sidebar-navigation-container`](01-sidebar-navigation-container/README.md) - کانتینر اصلی سایدبار چپ (حالت باز)
3. [`01-sidebar-collapsed-mode`](01-sidebar-collapsed-mode/README.md) - سایدبار در حالت بسته (Collapsed Mode) و دکمه بازگشایی
4. [`02-top-header-and-model-selector`](02-top-header-and-model-selector/README.md) - هدر بالایی و منوی انتخاب مدل هوش مصنوعی (GPT-4o, o1, o3)
5. [`03-chat-messages-scroll-area`](03-chat-messages-scroll-area/README.md) - محوطه اسکرول و چیدمان پیام‌های گفت‌وگو
6. [`04-composer-input-and-action-dock`](04-composer-input-and-action-dock/README.md) - فیلد ورودی پیام، داک دکمه‌های ویس، آپلود و تنظیمات
7. [`05-user-profile-menu-and-dropdown`](05-user-profile-menu-and-dropdown/README.md) - منوی پاپ‌آپ پروفایل کاربر در پایین سایدبار
8. [`06-sidebar-chat-history-item`](06-sidebar-chat-history-item/README.md) - المان تاریخچه چت‌ها و وضعیت‌های هاور و اکشن‌ها
9. [`07-chat-message-user`](07-chat-message-user/README.md) - حباب پیام کاربر، استایل راست‌به‌چپ (RTL) و دکمه ادیت
10. [`08-chat-message-assistant`](08-chat-message-assistant/README.md) - ساختار پاسخ مدل، مارک‌داون، دکمه‌های کپی، لایک، دیس‌لایک و خواندن صوتی
11. [`09-composer-input-and-attachments-bar`](09-composer-input-and-attachments-bar/README.md) - نوار پیوست فایل‌ها، چیپ‌های اسناد و دکمه‌های چت صوتی
12. [`10-quick-action-cards-grid`](10-quick-action-cards-grid/README.md) - کارت‌های پرامپت پیشنهادی صفحه اولیه چت جدید
13. [`11-settings-modal-dialog`](11-settings-modal-dialog/README.md) - پنجره مودال اصلی تنظیمات و فریم ناوبری تب‌ها

---

### بخش دوم: ۱۳ تب اختصاصی و عمیق تنظیمات (All 13 Settings Dialog Tabs)
14. [`12-settings-tab-general`](12-settings-tab-general/README.md) - تنظیمات عمومی (تم، زبان، بایگانی)
15. [`13-settings-tab-notifications`](13-settings-tab-notifications/README.md) - اعلان‌ها و رویدادهای ایمیل و پوش
16. [`14-settings-tab-personalization`](14-settings-tab-personalization/README.md) - شخصی‌سازی، دستورالعمل‌های سفارشی (Custom Instructions) و حافظه
17. [`15-settings-tab-speech`](15-settings-tab-speech/README.md) - تنظیمات صدا و مکالمه پیشرفته (Voice Mode)
18. [`16-settings-tab-data-controls`](16-settings-tab-data-controls/README.md) - کنترل‌های داده، سابقه چت و آموزش مدل، خروجی داده‌ها
19. [`17-settings-tab-builder-profile`](17-settings-tab-builder-profile/README.md) - پروفایل سازنده GPTها و تایید دامنه‌ها
20. [`18-settings-tab-connected-apps`](18-settings-tab-connected-apps/README.md) - اپلیکیشن‌های متصل و سرویس‌های ابری (Google Drive, OneDrive)
21. [`19-settings-tab-security`](19-settings-tab-security/README.md) - امنیت، ورود دو مرحله‌ای و نشست‌های فعال
22. [`20-settings-tab-scheduled-actions`](20-settings-tab-scheduled-actions/README.md) - وظایف و تسک‌های زمان‌بندی شده
23. [`21-settings-tab-parental-controls`](21-settings-tab-parental-controls/README.md) - کنترل والدین و فیلترهای محتوایی
24. [`22-settings-tab-manage-workspace`](22-settings-tab-manage-workspace/README.md) - مدیریت فضای کاری و ورک‌اسپیس تیمی
25. [`23-settings-tab-manage-members`](23-settings-tab-manage-members/README.md) - مدیریت اعضا و دسترسی‌های تیمی
26. [`24-settings-tab-subscription-and-billing`](24-settings-tab-subscription-and-billing/README.md) - پلن‌های اشتراک (Plus, Team, Enterprise) و فاکتورها

---

### بخش سوم: فضاهای کاری پروژه‌ها و پنجره‌های تعاملی (Projects & Interactive Overlays)
27. [`25-sources-tab-and-citations-panel`](25-sources-tab-and-citations-panel/README.md) - پنل منابع وب و نقل‌قول‌های جستجو
28. [`26-projects-workspace-and-files-view`](26-projects-workspace-and-files-view/README.md) - فضای کاری پروژه‌ها (Projects Workspace) و مدیریت اسناد
29. [`27-chat-options-and-context-menu`](27-chat-options-and-context-menu/README.md) - منوی سه‌نقطه گزینه‌های چت و منوهای زمینه
30. [`28-search-chats-modal-dialog`](28-search-chats-modal-dialog/README.md) - پالت فرمان و دیالوگ جستجوی عمیق مکالمات (Command Palette)

---

### بخش چهارم: کاتالوگ ۱۲ الگوی جامع انواع پیام‌ها (Universal Message Types Catalog)
31. [`30-message-type-code-blocks-and-syntax-highlighting`](30-message-type-code-blocks-and-syntax-highlighting/README.md) - بلوک‌های کدنویسی و سینتکس هایلایتینگ (Code Blocks)
32. [`31-message-type-rich-markdown-and-tables`](31-message-type-rich-markdown-and-tables/README.md) - جداول مارک‌داون و ساختارهای شبکه‌ای (Tables & Grids)
33. [`32-message-type-dalle-image-generation`](32-message-type-dalle-image-generation/README.md) - تصاویر تولید شده توسط هوش مصنوعی و لایت‌باکس گالری
34. [`33-message-type-file-attachments-and-chips`](33-message-type-file-attachments-and-chips/README.md) - پیوست فایل‌ها، اسناد PDF و چیپ‌های دانلودی
35. [`34-message-type-web-search-citations-and-sources`](34-message-type-web-search-citations-and-sources/README.md) - نتایج جستجوی وب، منابع و نقل‌قول‌ها
36. [`35-message-type-collapsible-thinking-reasoning`](35-message-type-collapsible-thinking-reasoning/README.md) - فرایند تفکر و استدلال عمیق (o1/o3 Thinking Trace)
37. [`36-message-type-python-code-interpreter`](36-message-type-python-code-interpreter/README.md) - محیط اجرای پایتون و خروجی‌های تحلیلی ترمینال
38. [`37-message-type-math-and-latex-formulas`](37-message-type-math-and-latex-formulas/README.md) - فرمول‌های ریاضی و نمادهای KaTeX/LaTeX
39. [`38-message-type-multi-turn-composite-conversation`](38-message-type-multi-turn-composite-conversation/README.md) - گفتگوی چند نوبته و پیام‌های عظیم ترکیبی
40. [`39-message-type-response-action-toolbar`](39-message-type-response-action-toolbar/README.md) - نوار ابزار اکشن‌های پاسخ و وضعیت هاور
41. [`40-message-type-user-prompt-styles`](40-message-type-user-prompt-styles/README.md) - استایل پیام‌های کاربر و ویرایشگر درجا
42. [`41-message-type-error-and-retry-states`](41-message-type-error-and-retry-states/README.md) - وضعیت‌های خطا، محدودیت شبکه و دکمه تلاش مجدد

---

### بخش پنجم: ماژول‌های اختصاصی سرچ، فیلتر، ویس و پلیر صوتی (Search, Filter, Voice, Audio Player)
43. [`42-search-chats-and-command-palette-modal`](42-search-chats-and-command-palette-modal/README.md) - دیالوگ جستجوی چت‌ها، پالت فرمان، لیست Last opened و Recent chats
44. [`43-filter-dropdown-and-active-state`](43-filter-dropdown-and-active-state/README.md) - دکمه فیلتر با آیکون قیف، بج Active و منوی دراپ‌داون وضعیت‌ها
45. [`44-voice-input-microphone-and-dictation`](44-voice-input-microphone-and-dictation/README.md) - میکروفون ورودی ویس، تبدیل گفتار به متن و انیمیشن پالس ضبط
46. [`45-read-aloud-voice-player-and-tts`](45-read-aloud-voice-player-and-tts/README.md) - قابلیت خواندن صوتی پیام (Read Aloud) و کامپوننت کامل پلیر صوتی ویس

---

### بخش ششم: پکیج کرپوس ۳۰ گفت‌وگوی واقعی کاربر (30-Chat Corpus Package)
موجود در پوشه [`chat-corpus-30-threads`](chat-corpus-30-threads/):
1. **thread-01**: سلام و خوشامدگویی
2. **thread-02**: سلام و احوالپرسی
3. **thread-03**: تحلیل و ارزیابی زبان End (شامل بلوک‌های کد و سینتکس)
4. **thread-04**: تحلیل پرامپت حرفه‌ای (شامل جداول و ماتریس ارزیابی)
5. **thread-05**: Greeting response (پاسخ‌های چندزبانه انگلیسی)
6. **thread-06**: روست کردن بی‌رحمانه (تولید محتوای دیالوگی طنز)
7. **thread-07**: روست طنز فارسی (تولید لحن محاوره‌ای)
8. **thread-08**: روست طنز بدون ترحم (سوییچینگ لحن پویا)
9. **thread-09**: درخواست طنز و مکالمه خاص (منطق چت پیچیده)
10. **thread-10**: نحوه استفاده از DLSS (مشخصات فنی و سخت‌افزاری)
11. **thread-11**: مقایسه مکمل راهب (جداول مقایسه‌ای کامل)
12. **thread-12**: سلام کردن و گفتگوی عمومی
13. **thread-13**: تحلیل پرامپت حرفه‌ای ۲
14. **thread-14**: تحلیل پرامپت حرفه‌ای ۳
15. **thread-15**: بوی بد دهان طوطی (راهنماهای تشخیصی و پزشکی)
16. **thread-16**: علت خطای EA (عیب‌یابی خطاهای نرم‌افزاری)
17. **thread-17**: نگهداری لپتاپ گیمینگ (راهنمای جامع چند نوبته)
18. **thread-18**: پخت کیک کاکائویی (دستورالعمل، لیست بالت و جدول مواد)
19. **thread-19**: شاخه · تحلیل پرامپت حرفه‌ای (انشعاب چت و درخت مکالمه)
20. **thread-20**: تحلیل پرامپت حرفه‌ای ۴
21. **thread-21**: تحلیل پرامپت حرفه‌ای ۵ (فرمول‌ها و ارزیابی عمیق)
22. **thread-22**: تحلیل پرامپت حرفه‌ای ۶
23. **thread-23**: تحلیل پرامپت حرفه‌ای ۷
24. **thread-24**: تحلیل پرامپت حرفه‌ای ۸
25. **thread-25**: پروژه پرامپت wp03 T3 (فضای کاری پروژه سفارشی)
26. **thread-26**: پروژه پرامپت wp03 T6 (معماری چت پروژه‌ای)
27. **thread-27**: گالری تولید تصویر هوش مصنوعی (گالری تصاویر و لایت‌باکس)
28. **thread-28**: وظایف و رویدادهای زمان‌بندی شده (اتوماسیون‌ها)
29. **thread-29**: کتابخانه و اسناد ذخیره شده (مخزن فایل‌ها و کتابخانه)
30. **thread-30**: فضای کدنویسی و توسعه Codex (کانواس اجرای کد زنده)

---

## 🚀 راهنمای سریع تزریق اکستنشن (Chrome Extension Injection Quickstart):

```javascript
// تزریق پلیر صوتی پیشرفته و دکمه‌های اختصاصی
import { injectAudioPlayerToMessage } from './45-read-aloud-voice-player-and-tts/CustomMessageAudioPlayer.js';

const observer = new MutationObserver((mutations) => {
  document.querySelectorAll('[data-message-author-role="assistant"]').forEach((msg) => {
    if (!msg.dataset.customUiInjected) {
      msg.dataset.customUiInjected = 'true';
      
      // تزریق پلیر صوتی با تایم‌لاین، کنترل سرعت و دانلود
      const text = msg.querySelector('.markdown.prose')?.innerText || msg.innerText;
      injectAudioPlayerToMessage(msg, text);
    }
  });
});

observer.observe(document.body, { childList: true, subtree: true });
```

---
*تولید شده توسط سیستم مهندسی معکوس و کالبدشکافی DOM زنده: **McpDOM-Browser Enterprise**.*
