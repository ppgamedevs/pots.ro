"use client";
import Link from "next/link";

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white px-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-xl p-8 text-center">
        <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-2xl">!</div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Link-ul a fost deja folosit</h1>
        <p className="text-slate-600 mb-6">
          Se pare că ai încercat să folosești din nou linkul de autentificare. Pentru siguranță, linkurile se pot folosi o singură dată.
        </p>
        <Link href="/account" className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-5 py-3 text-white hover:bg-slate-800 transition-colors">
          Mergi la Contul meu
        </Link>
        <div className="mt-4 text-sm text-slate-500">
          Sau <Link href="/login" className="text-slate-900 hover:underline">autentifică-te din nou</Link>
        </div>
      </div>
    </div>
  );
}


