"use client";
import Link from "next/link";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { JSX, SVGProps, useState } from "react";
import { createAccount } from "@/app/lib/auth";
import { hasCookie } from "cookies-next";
import { useRouter } from "next/navigation";

export default function Component() {
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [buttonText, setButtonText] = useState<string>("Register");
  const router = useRouter();
  if (hasCookie("jwt")) {
    router.push("/dashboard");
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsProcessing(true);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setIsProcessing(false);
      return;
    } else {
      setError(null);
    }

    try {
      setButtonText("Registering...");

      const response = await createAccount(name, email, password);
      console.log(response);
      const parsedResponse = await JSON.parse(response as string);
      if (parsedResponse["status"] === 200) {
        setButtonText("Account created");
        setTimeout(() => {
          window.location.href = "/auth/login";
        }, 2000);
        return;
      } else {
        setButtonText("Register");
        setError(parsedResponse["message"]);
        setIsProcessing(false);
        return;
      }
    } catch (e) {
      setButtonText("Register");
      setError(
        "An error occurs while creating an account, please try again later."
      );
      return;
    }
  };
  return (
    <div className="flex items-center min-h-screen px-4">
      <div className="mx-auto w-full max-w-sm space-y-4">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">Create an account</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Already have an account?
            <Link className="underline ml-1" href="login">
              Login
            </Link>
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-2">
          <div className="space-y-2">
            <Label htmlFor="name">Full name</Label>
            <Input
              id="name"
              placeholder="John Doe"
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
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
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              placeholder="************"
              onChange={(e) => setPassword(e.target.value)}
              value={password}
              required
              type="password"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm Password</Label>
            <Input
              id="confirm-password"
              placeholder="************"
              onChange={(e) => setConfirmPassword(e.target.value)}
              value={confirmPassword}
              required
              type="password"
            />
          </div>
          {error && (
            <div className="text-red-500 text-sm font-semibold">{error}</div>
          )}
          <br></br>

          <Button className="w-full" type="submit" disabled={isProcessing}>
            {buttonText}
          </Button>
        </form>
        <Button
          className="w-full flex items-center justify-center"
          variant="outline"
          disabled={isProcessing}
        >
          <GoogleIcon className="h-5 w-5 mr-2 font-bold" />
          Register with Google
        </Button>
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
