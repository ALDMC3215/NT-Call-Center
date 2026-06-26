# راهنمای راه‌اندازی اولیه — مدیران سیستم نوین‌تک

این راهنما را **قبل از استفاده از اپلیکیشن** دنبال کنید.

---

## مرحله ۱: اجرای Migration در Supabase

۱. وارد داشبورد پروژه Supabase خود شوید.
۲. از منوی سمت چپ، **SQL Editor** را باز کنید.
۳. روی **New query** کلیک کنید.
۴. محتوای فایل زیر را **کامل** کپی و در editor جای‌گذاری کنید:

```
supabase/migrations/20260625_create_profiles.sql
```

۵. روی **Run** کلیک کنید.
۶. باید پیام موفقیت یا `Success. No rows returned` نمایش داده شود.
۷. Migration ایمن (idempotent) است — در صورت نیاز می‌توانید دوباره اجرا کنید.

---

## مرحله ۲: تنظیم Auth URLs در Supabase

در داشبورد Supabase به **Authentication → URL Configuration** بروید.

### Site URL

باید به دامنه **پروداکشن Vercel** (نه localhost) تنظیم شود:

```
https://<your-vercel-domain>.vercel.app
```

> ⚠️ **مهم:** Site URL تنها مقدار اصلی برای لینک‌های تأیید ایمیل است.
> اگر به اشتباه `localhost` تنظیم شود، کاربران واقعی نمی‌توانند ایمیل خود را تأیید کنند.
> در محیط توسعه، `emailRedirectTo: window.location.origin` در کد فرانت وجود دارد
> که این مشکل را برای localhost برطرف می‌کند.

### Redirect URLs

هر یک را جداگانه اضافه کنید:

```
http://localhost:3000
http://localhost:3000/**
https://<your-vercel-domain>.vercel.app
https://<your-vercel-domain>.vercel.app/**
```

> دامنه Vercel واقعی خود را جایگزین `<your-vercel-domain>` کنید.

---

## مرحله ۳: فعال‌سازی تأیید ایمیل (Confirm Email)

در داشبورد Supabase به **Authentication → Email** بروید.

اطمینان حاصل کنید که گزینه **"Confirm email"** فعال (روشن) است.

> ⚠️ اگر این گزینه خاموش باشد، هر حساب جدید بلافاصله بدون تأیید ایمیل فعال می‌شود
> و ممکن است با منطق `pending` سیستم تداخل داشته باشد.

---

## مرحله ۴: ثبت‌نام مدیران

هر یک از چهار مدیر باید از طریق **«ساخت حساب / درخواست دسترسی»** در صفحه ورود اقدام کنند.

> ⚠️ استفاده از صفحه «ورود مدیریت» برای ثبت‌نام امکان‌پذیر نیست و نباید باشد.
> مدیران مانند کارشناسان ابتدا ثبت‌نام می‌کنند، سپس در پایگاه داده ارتقا می‌یابند.

مراحل برای هر مدیر:
1. به اپلیکیشن بروید.
2. پنل **«ورود کارشناس»** را انتخاب کنید.
3. روی تب **«ساخت حساب / درخواست دسترسی»** کلیک کنید.
4. نام کامل، ایمیل، و رمز عبور را وارد کنید.
5. ایمیل تأیید را از صندوق ورودی تأیید کنید.

---

## مرحله ۵: ارتقای مدیران به نقش Admin (Bootstrap SQL)

پس از اینکه **همه چهار مدیر** ثبت‌نام کردند و ایمیل خود را تأیید نمودند،
دستور SQL زیر را در **SQL Editor** اجرا کنید.

> ⚠️ ایمیل واقعی هر مدیر را جایگزین placeholder کنید.
> هرگز ایمیل‌های واقعی را در اسناد عمومی قرار ندهید.

```sql
-- Bootstrap: ارتقای چهار مدیر اصلی
-- این query را فقط یک‌بار و پس از ثبت‌نام همه مدیران اجرا کنید.

UPDATE public.profiles
SET
  role           = 'admin',
  account_status = 'active',
  duty_group     = 'late_week'
WHERE email = '<email-of-forqani>';          -- مهندس فرقانی

UPDATE public.profiles
SET
  role           = 'admin',
  account_status = 'active',
  duty_group     = 'late_week'
WHERE email = '<email-of-zare>';             -- مهندس زارع

UPDATE public.profiles
SET
  role           = 'admin',
  account_status = 'active',
  duty_group     = 'early_week'
WHERE email = '<email-of-esmaili>';          -- مهندس اسماعیلی

UPDATE public.profiles
SET
  role           = 'admin',
  account_status = 'active',
  duty_group     = 'early_week'
WHERE email = '<email-of-shayeghi-fard>';   -- مهندس شایقی فرد
```

**تأیید:**
```sql
SELECT email, full_name, role, account_status, duty_group
FROM public.profiles
WHERE role = 'admin';
```
باید ۴ ردیف با `role = 'admin'` و `account_status = 'active'` نمایش داده شود.

---

## مرحله ۶: فعال‌سازی کارشناسان از طریق UI

پس از اینکه حداقل یک مدیر فعال شد:

۱. آن مدیر با ایمیل و رمز عبور خود از **«ورود مدیریت»** وارد می‌شود.
۲. پنل مدیریت باز می‌شود.
۳. در تب **«درخواست‌های جدید»**، کارشناسان در انتظار دیده می‌شوند.
۴. مدیر روی دکمه **«تأیید»** کلیک می‌کند.
۵. کارشناس می‌تواند فوری وارد پنل خود شود.

---

## مرحله ۷: غیرفعال‌سازی کارشناس

در تب **«کارشناسان فعال»** در پنل مدیریت:
- روی دکمه **«غیرفعال»** کنار هر کارشناس کلیک کنید.
- کارشناس فوراً از پنل خارج خواهد شد.

---

## نکات امنیتی

| موضوع | وضعیت |
|-------|--------|
| کلید `service_role` در فرانت‌اند | ❌ استفاده نمی‌شود |
| فایل `.env.local` در git | ❌ gitignore شده |
| تغییر `role` از طریق UI | ❌ امکان‌پذیر نیست |
| تغییر `account_status` از طریق UPDATE مستقیم | ❌ هیچ UPDATE policy وجود ندارد |
| تأیید حساب توسط خودِ کاربر | ❌ RPC guard: `caller_id = target_id` |
| approve_agent روی حساب‌های غیر-pending | ❌ WHERE `account_status = 'pending'` |
| approve_agent روی admin | ❌ WHERE `role = 'agent'` |
| EXECUTE توسط anonymous | ❌ REVOKE ALL FROM PUBLIC |
| is_admin() از JWT یا UI | ❌ مستقیم از DB خوانده می‌شود |
| search_path injection در SECURITY DEFINER | ❌ `SET search_path = ''` |
| emailRedirectTo | ✅ `window.location.origin` |
| Site URL در docs | ✅ Vercel production domain |

---

## گروه‌های کاری

| نام | duty_group | برچسب نمایشی |
|-----|-----------|---------------|
| مهندس فرقانی   | `late_week`  | مدیر آخر هفته |
| مهندس زارع     | `late_week`  | مدیر آخر هفته |
| مهندس اسماعیلی | `early_week` | مدیر اول هفته |
| مهندس شایقی فرد| `early_week` | مدیر اول هفته |

> این برچسب‌ها فقط نمایشی هستند و هیچ تأثیری بر سطح دسترسی ندارند.
> همه مدیران فعال می‌توانند کارشناسان را تأیید یا غیرفعال کنند.

---

## محدودیت‌های فاز فعلی

- ارتقای نقش به admin فقط از طریق SQL انجام می‌شود (UI ندارد).
- بازیابی رمز عبور (Reset Password) هنوز پیاده‌سازی نشده.
- ورود با Google (OAuth) هنوز فعال نشده.
- انتقال داده‌های تماس از localStorage به Supabase انجام نشده.
