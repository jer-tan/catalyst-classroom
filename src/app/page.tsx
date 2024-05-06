"use client";
import Link from "next/link";
import { JSX, SVGProps } from "react";
import { RocketIcon } from "@/components/icon";
import { useEffect, useState } from "react";
import { hasCookie } from "cookies-next";

export default function Home() {
  const [loginStatus, setLoginStatus] = useState(false);
  useEffect(() => {
    if (!hasCookie("jwt")) {
      setLoginStatus(false);
    } else {
      setLoginStatus(true);
    }
  }, []);

  return (
    <main>
      <div className="flex flex-col items-center justify-center min-h-[100dvh]">
        <div className="flex items-center space-x-4">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl/none flex">
            <RocketIcon className="w-20 h-20 mr-2 text-gray-900 dark:text-gray-50" />
            Catalyst
          </h1>
        </div>
        <section className="w-full py-8">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400 mb-2">
                  Empowering Education, Elevating Students
                </p>
              </div>

              {loginStatus ? (
                <Link
                  className="inline-flex h-9 items-center justify-center rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-gray-50 shadow transition-colors hover:bg-gray-900/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:pointer-events-none disabled:opacity-50 dark:bg-gray-50 dark:text-gray-900 dark:hover:bg-gray-50/90 dark:focus-visible:ring-gray-300"
                  href="/dashboard"
                >
                  Go to Dashboard
                </Link>
              ) : (
                <div className="space-x-4">
                  <Link
                    className="inline-flex h-9 items-center justify-center rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-gray-50 shadow transition-colors hover:bg-gray-900/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:pointer-events-none disabled:opacity-50 dark:bg-gray-50 dark:text-gray-900 dark:hover:bg-gray-50/90 dark:focus-visible:ring-gray-300"
                    href="/auth/login"
                  >
                    Login
                  </Link>
                  <Link
                    className="inline-flex h-9 items-center justify-center rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:pointer-events-none disabled:opacity-50 dark:border-gray-800 dark:bg-gray-950 dark:hover:bg-gray-800 dark:hover:text-gray-50 dark:focus-visible:ring-gray-300"
                    href="/auth/register"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
