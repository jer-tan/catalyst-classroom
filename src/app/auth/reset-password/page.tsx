"use client";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useState } from "react";
import { resetPassword } from "@/app/lib/auth";
import { useRouter } from "next/navigation";
import { hasCookie } from "cookies-next";

export default function Component() {
  const [email, setEmail] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const router = useRouter();
  if (hasCookie("jwt")) {
    router.push("/dashboard");
  }

  const handleResetPasswordSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    // Send email to user with reset password link

    setIsProcessing(true);

    const response = await resetPassword(email);
    const parsedResponse = JSON.parse(response as string);
    if (parsedResponse.status == 200) {
      const message = parsedResponse.message;
      setSuccessMessage(message);
      setError(null);
      setIsProcessing(false);
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
              Enter your email below to reset your password
            </p>
          </div>
          <div className="space-y-4">
            <div className="space-y-2 mt-4">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                placeholder="alex@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                type="email"
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
