# مستندات کامل: دکمه و منوی فیلتر (Filter Dropdown & Active State)
### Filter Button, Funnel Icon & Filter Popover Menu

این بخش کالبدشکافی دکمه فیلتر (`Active / Filter`) با آیکون قیف فیلتر و منوی دراپ‌داون وضعیت‌های فیلترینگ تسک‌ها، چت‌ها و رویدادهای زمان‌بندی شده را ارائه می‌دهد.

---

## 📌 تصویر واقعی از دکمه فیلتر در صفحه:
![Filter Button Screenshot](screenshot.png)

---

## 🔍 تحلیل کالبدشکافی ساختار DOM:
- **دکمه فیلتر فعال:** `button:has(polygon), button:contains("Active")`
- **آیکون قیف فیلتر:** `svg polygon[points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"]`
- **منوی پاپ‌اور وضعیت‌ها:** `div[role="menu"][aria-orientation="vertical"]`
- **آیتم‌های فیلتر:** `button[role="menuitem"]`

---

## 🛠️ راهنمای تزریق اکستنشن (افزودن فیلترهای سفارشی مثل فیلتر بر اساس تاریخ یا مدل):
```javascript
// افزودن گزینه‌های فیلتر سفارشی به منوی دراپ‌داون
const filterMenu = document.querySelector('[role="menu"]');
if (filterMenu && !filterMenu.dataset.customFiltersAdded) {
  filterMenu.dataset.customFiltersAdded = 'true';
  const customOption = document.createElement('button');
  customOption.className = 'flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs text-token-text-primary hover:bg-token-surface-hover';
  customOption.innerHTML = '<span>⚡ فیلتر چت‌های ستاره‌دار</span><span class="text-amber-400">★</span>';
  filterMenu.appendChild(customOption);
}
```
