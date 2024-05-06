"use client";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useEffect, useState } from "react";
import { passwordResetCodeCheck, passwordResetSubmit } from "@/app/lib/auth";
import { hasCookie } from "cookies-next";
import { useRouter } from "next/navigation";

export default function Component() {
  const [password, setPassword] = useState<string>("");
  const [reenterPassword, setReenterPassword] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [code, setCode] = useState<string>("");
  const [name, setName] = useState<string>("there");
  const router = useRouter();
  let rendered = false;

  if (hasCookie("jwt")) {
    router.push("/dashboard");
  }

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("code");
    if (code && !rendered) {
      // Handle the code here
      setCode(code);
      handleCodeCheck(code);
    } else if (!code && !rendered) {
      // Redirect user to reset password page
      window.location.href = "/auth/reset-password";
    }
    rendered = true;
  }, []);

  const handleCodeCheck = async (c: string) => {
    const response = await passwordResetCodeCheck(c);
    const parsedResponse = JSON.parse(response as string);
    console.log(response);
    if (parsedResponse.status == 200) {
      const name = parsedResponse.username;
      setName(name);
    } else {
      // redirect user to reset password page
      window.location.href = "/auth/reset-password";
    }
  };

  const handleResetPasswordSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    setIsProcessing(true);

    if (password !== reenterPassword) {
      setError("Passwords do not match");
      setSuccessMessage(null);
      setIsProcessing(false);
      return;
    }

    const response = await passwordResetSubmit(code, password);
    const parsedResponse = JSON.parse(response as string);
    if (parsedResponse.status == 200) {
      const message = parsedResponse.message;
      setSuccessMessage(message);
      setError(null);
      // redirect user in 5 seconds
      setTimeout(() => {
        window.location.href = "/auth/login";
      }, 5000);
      return;
    } else {
      setError(parsedResponse.message);
      setSuccessMessage(null);
      setIsProcessing(false);
      return;
    }
  };

  return (
    <div className="flex items-center min-h-screen px-4">
      <div className="mx-auto w-full max-w-sm space-y-4">
        <form onSubmit={handleResetPasswordSubmit}>
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-bold">Reset password</h1>
            <p className="text-gray-500 dark:text-gray-400">
              Hello {name}, we are glad you&apos;re back! Please set your new
              password below.
            </p>
          </div>
          <div className="space-y-4">
            <div className="space-y-2 mt-4">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                placeholder="***********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                type="password"
              />
            </div>
            <div className="space-y-2 mt-4">
              <Label htmlFor="password">Confirm Password</Label>
              <Input
                id="re-password"
                placeholder="***********"
                value={reenterPassword}
                onChange={(e) => setReenterPassword(e.target.value)}
                required
                type="password"
              />
              {error && (
                <div className="text-red-500 text-sm font-semibold">
                  {error}
                </div>
              )}
              {successMessage && (
                <div className="text-blue-500 text-sm font-semibold">
                  {successMessage}
                </div>
              )}
            </div>

            <Button className="w-full" type="submit" disabled={isProcessing}>
              {isProcessing ? "Processing..." : "Reset Password"}
            </Button>
            <div className="space-y-2 text-center font-semibold">
              <Link className="inline-block hover:underline" href="login">
                Back to Login
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
