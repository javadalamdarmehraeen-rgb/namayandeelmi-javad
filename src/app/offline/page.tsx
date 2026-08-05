export const dynamic = "force-static";

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-100 p-6 text-center">
      <div className="text-5xl">📴</div>
      <h1 className="text-lg font-black text-slate-800">اتصال اینترنت برقرار نیست</h1>
      <p className="max-w-sm text-sm text-slate-500">
        برنامه در حالت آفلاین اجرا می‌شود. می‌توانید اطلاعات را ثبت کنید؛ به‌محض وصل شدن اینترنت (موبایل، وای‌فای یا
        هر نوع دیگر) همه‌چیز به‌صورت خودکار ارسال می‌شود.
      </p>
      <a href="/" className="rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-bold text-white">
        تلاش مجدد
      </a>
    </main>
  );
}
