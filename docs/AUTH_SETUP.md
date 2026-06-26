# Auth Setup Guide — NovinTech Call Manager

این راهنما مراحل دستی لازم پس از استقرار کد را توضیح می‌دهد.

---

## ۱. اجرای migration در Supabase SQL Editor

۱. وارد داشبورد Supabase پروژه خود شوید.
۲. از منوی سمت چپ، **SQL Editor** را باز کنید.
۳. روی **New query** کلیک کنید.
۴. محتوای فایل زیر را کپی و جای‌گذاری کنید:

```
supabase/migrations/20260625_create_profiles.sql
```

۵. روی **Run** کلیک کنید.
۶. باید پیام `Success. No rows returned` یا مشابه آن ظاهر شود.

> **نکته:** این migration ایمن (idempotent) است — می‌توان آن را چند بار اجرا کرد بدون خطا.

---

## ۲. تنظیم Redirect URLs در Supabase Auth

برای اینکه تأیید ایمیل و لینک‌های بازیابی رمز عبور درست کار کنند:

۱. در داشبورد Supabase به **Authentication → URL Configuration** بروید.
۲. در بخش **Redirect URLs**، آدرس‌های زیر را اضافه کنید:

```
http://localhost:3000
http://localhost:3000/**
https://<your-vercel-domain>.vercel.app
https://<your-vercel-domain>.vercel.app/**
```

> دامنه Vercel واقعی خود را جایگزین `<your-vercel-domain>` کنید.

۳. **Save** کنید.

---

## ۳. فعال‌سازی اولین مدیر (Admin) به صورت دستی

پس از اینکه شخص مورد نظر از طریق صفحه ثبت‌نام حساب ایجاد کرد و ایمیل خود را تأیید نمود:

۱. در SQL Editor دستور زیر را اجرا کنید:

```sql
UPDATE public.profiles
SET
  role           = 'admin',
  account_status = 'active'
WHERE id = (
  SELECT id FROM auth.users
  WHERE email = '<email-of-the-admin-user>'
  LIMIT 1
);
```

> ایمیل واقعی مدیر را جایگزین `<email-of-the-admin-user>` کنید.

۲. پس از اجرا، مدیر می‌تواند بلافاصله وارد پنل شود.

---

## ۴. فعال‌سازی کارشناسان (Agent) توسط مدیر

هر کارشناس پس از ثبت‌نام با وضعیت `pending` ایجاد می‌شود. برای فعال‌سازی:

```sql
UPDATE public.profiles
SET account_status = 'active'
WHERE id = (
  SELECT id FROM auth.users
  WHERE email = '<email-of-the-agent>'
  LIMIT 1
);
```

برای غیرفعال‌سازی:

```sql
UPDATE public.profiles
SET account_status = 'disabled'
WHERE id = (
  SELECT id FROM auth.users
  WHERE email = '<email-of-the-agent>'
  LIMIT 1
);
```

---

## ۵. تأیید ایمیل (Email Confirmation)

- به طور پیش‌فرض، Supabase برای هر حساب جدید یک ایمیل تأیید ارسال می‌کند.
- کاربر باید **هم** ایمیل را تأیید کند **و هم** منتظر فعال‌سازی توسط مدیر بماند.
- اگر می‌خواهید تأیید ایمیل را در محیط توسعه غیرفعال کنید:
  - **Authentication → Email** → **Confirm email** را خاموش کنید.
  - ⚠️ این کار را در محیط production انجام ندهید.

---

## ۶. امنیت — موارد مهم

- کلید `service_role` هرگز در کد فرانت‌اند قرار نمی‌گیرد.
- فایل `.env.local` در `.gitignore` ثبت شده و کامیت نمی‌شود.
- فقط `VITE_SUPABASE_PUBLISHABLE_KEY` (کلید anon عمومی) در فرانت استفاده می‌شود.
- تغییر `role` و `account_status` فقط از طریق SQL Editor یا backend با `service_role` ممکن است — نه از طریق کد فرانت‌اند.

---

## ۷. آنچه در فاز بعدی اضافه می‌شود

- ورود با Google (OAuth) به عنوان روش ثانویه
- پنل مدیریت در UI برای فعال/غیرفعال‌سازی کارشناسان
- انتقال داده‌های تماس از localStorage به Supabase
