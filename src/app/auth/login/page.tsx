"use client";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import Cookies from "universal-cookie";
import { Button } from "@/components/ui/button";
import { JSX, SVGProps, useEffect, useState } from "react";
import { passwordAuth, googleAuth } from "@/app/lib/auth";
import { useRouter } from "next/navigation";
import { hasCookie } from "cookies-next";

export default function Page() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [googleDisplayError, setGoogleDisplayError] = useState<string | null>(
    null
  );
  const router = useRouter();
  let googleCode: string | null;
  let googleError: string | null;

  // get parameters from the URL
  if (typeof window !== "undefined") {
    googleCode = new URLSearchParams(window.location.search).get("code");
    googleError = new URLSearchParams(window.location.search).get("error");
  }

  if (hasCookie("jwt")) {
    router.push("/dashboard");
  }

  const handleGoogleLogin = async () => {
    setIsProcessing(true);
    if (!googleCode) return;
    const response = await googleAuth(googleCode);
    const parsedResponse = JSON.parse(response as string);
    if (parsedResponse.status == 200) {
      const token = parsedResponse.token;
      const cookies = new Cookies(null, { path: "/" });
      await cookies.set("jwt", token, {
        secure: true,
        sameSite: "strict",
        maxAge: 86400,
      });
      router.push("/dashboard");
    } else {
      setError(parsedResponse.message);
      setIsProcessing(false);
      return;
    }
  };

  useEffect(() => {
    if (googleError) {
      setGoogleDisplayError(googleError);
    } else if (googleCode) {
      handleGoogleLogin();
    }
  }, []);

  const handleLoginSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsProcessing(true);
    const response = await passwordAuth(email, password);
    const parsedResponse = JSON.parse(response);
    if (parsedResponse.status == 200) {
      const token = parsedResponse.token;
      const cookies = new Cookies(null, { path: "/" });
      await cookies.set("jwt", token, {
        secure: true,
        sameSite: "strict",
        maxAge: 86400,
      });
      router.push("/dashboard");
    } else {
      setError(parsedResponse.message);
      setIsProcessing(false);
      return;
    }
  };

  return (
    <div className="flex items-center min-h-screen px-4">
      <div className="mx-auto w-full max-w-sm space-y-4">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">Login</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Enter your email below to login to your account
          </p>
        </div>
        <form onSubmit={handleLoginSubmit}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                placeholder="alex@example.com"
                onChange={(e) => setEmail(e.target.value)}
                value={email}
                required
                type="email"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center">
                <Label htmlFor="password">Password</Label>
                <Link
                  className="ml-auto inline-block text-sm hover:underline"
                  href="reset-password"
                >
                  Forgot your password?
                </Link>
              </div>
              <Input
                id="password"
                onChange={(e) => setPassword(e.target.value)}
                value={password}
                placeholder="************"
                required
                type="password"
              />
              {error && (
                <div className="text-red-500 text-sm font-semibold">
                  {error}
                </div>
              )}
            </div>
            <br></br>
            <Button
              disabled={isProcessing}
              className="w-full font-bold"
              type="submit"
            >
              {isProcessing ? "Logging in..." : "Login"}
            </Button>
            <a href={process.env.GOOGLE_LOGIN_URI}>
              <Button
                className="w-full flex items-center justify-center mt-4"
                variant="outline"
                type="button"
              >
                <GoogleIcon className="h-5 w-5 mr-2 font-bold" />
                Login with Google
              </Button>
              {googleDisplayError && (
                <div className="text-red-500 text-sm text-center font-semibold mt-1">
                  {googleDisplayError}
                </div>
              )}
            </a>
          </div>
        </form>
        <div className="space-y-2 mt-5 text-center font-semibold">
          <Link className="inline-block hover:underline" href="register">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon(props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      width="96px"
      height="96px"
    >
      <path
        fill="#FFC107"
        d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
      />
      <path
        fill="#FF3D00"
        d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
      />
      <path
        fill="#1976D2"
        d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
      />
    </svg>
  );
}
