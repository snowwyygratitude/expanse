import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center px-6 text-center">
      <div>
        <h1 className="font-display text-4xl font-semibold">This page wandered off.</h1>
        <p className="mt-3 text-ink-soft">Let's get you back to something worth exploring.</p>
        <Link
          href="/home"
          className="mt-6 inline-flex rounded-full bg-ink px-5 py-3 text-[15px] font-semibold text-white"
        >
          Back to home
        </Link>
      </div>
    </main>
  );
}
