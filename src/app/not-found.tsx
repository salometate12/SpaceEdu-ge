import Link from "next/link";
import { ka } from "@/lib/i18n";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <h1 className="text-2xl font-bold text-zinc-900 md:text-4xl dark:text-zinc-50">
        {ka.notFound.title}
      </h1>
      <p className="mt-2 text-zinc-500 dark:text-zinc-400">
        {ka.notFound.message}
      </p>
      <Link
        href="/"
        className="mt-6 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-700"
      >
        {ka.notFound.back}
      </Link>
    </div>
  );
}
