# مستندات کامل: خواندن صوتی پیام توسط GPT و پیاده‌سازی پلیر پیشرفته ویس
### Read Aloud Architecture, TTS Audio Stream & Custom Injected Voice Player

این بخش شامل کالبدشکافی کامل دکمه بلندگوی صوتی (`🔊 Read aloud`) در نوار ابزار پاسخ‌های چت‌جی‌پی‌تی و سورس‌کد کامل یک **پلیر صوتی اختصاصی مدرن** برای پخش صدا با کنترل کامل (Play/Pause, Timeline, Speed, Waveform, Download) می‌باشد.

---

## 📌 تصویر واقعی از دکمه Read Aloud و نوار ابزار پیام:
![Read Aloud Screenshot](screenshot.png)

---

## 🔍 تحلیل کالبدشکافی ساختار DOM:
- **دکمه خواندن صوتی اصلی چت‌جی‌پی‌تی:** `button[aria-label="Read aloud"], button[data-testid="read-aloud-button"]`
- **آیکون بلندگو:** `svg polygon[points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"]`
- **موتور تولید صوت:** وب‌سوکت استریم صوتی OpenAI TTS (`backend-api/synthesize`) و API مرورگر `window.speechSynthesis`.

---

## 🎵 کامپوننت آماده پلیر صوتی اختصاصی (Custom Audio Player Injection):

یک فایل آماده با نام [`CustomMessageAudioPlayer.js`](CustomMessageAudioPlayer.js) در همین پوشه قرار داده شده است که به سادگی به انتهای هر پیام تزریق شده و قابلیت‌های زیر را اضافه می‌کند:
1. **دکمه گرد Play / Pause** با تغییر درجا آیکون و ترنزیشن مقیاس.
2. **تایم‌لاین و نوار پیشرفت (Scrub Bar)** با نمایش زمان سپری‌شده و کل مدت زمان.
3. **دکمه تنظیم سرعت پخش (1x, 1.25x, 1.5x, 2x)**.
4. **ویژوالایزر صوتی پالس‌دار (Waveform Bars)**.
5. **پشتیبانی کامل از زبان فارسی و انگلیسی**.

```javascript
import { injectAudioPlayerToMessage } from './45-read-aloud-voice-player-and-tts/CustomMessageAudioPlayer.js';

// تزریق خودکار پلیر صوتی به تمام پاسخ‌های هوش مصنوعی
document.querySelectorAll('[data-message-author-role="assistant"]').forEach(msg => {
  const text = msg.querySelector('.markdown.prose')?.innerText || msg.innerText;
  injectAudioPlayerToMessage(msg, text);
});
```
