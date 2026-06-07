import Link from "next/link";

export default function NotFound() {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-50 p-6 text-center text-zinc-800">
        <p className="text-sm text-zinc-600">Page not found.</p>
        <div className="flex gap-4 text-sm font-medium">
          <Link href="/zh" className="text-blue-600 underline-offset-2 hover:underline">
            中文
          </Link>
          <Link href="/en" className="text-blue-600 underline-offset-2 hover:underline">
            English
          </Link>
        </div>
      </body>
    </html>
  );
}
