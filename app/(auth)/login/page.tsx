"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { loginUser } from "@/lib/actions/auth";
import { Suspense } from "react";

type LoginState = { error?: string };
const initialState: LoginState = {};

function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";
  const [state, formAction, isPending] = useActionState(loginUser, initialState);

  return (
    <Card className="w-full max-w-md bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-2xl text-slate-100">Welcome back</CardTitle>
        <CardDescription className="text-slate-400">
          Sign in to your Motor Miniatures account
        </CardDescription>
      </CardHeader>
      <form action={formAction}>
        <input type="hidden" name="callbackUrl" value={callbackUrl} />
        <CardContent className="space-y-4">
          {state.error && (
            <p className="text-sm text-red-400">{state.error}</p>
          )}

          <div className="space-y-1">
            <Label htmlFor="username" className="text-slate-300">Username</Label>
            <Input
              id="username"
              name="username"
              type="text"
              placeholder="your_username"
              className="bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-500 focus-visible:ring-blue-500"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="password" className="text-slate-300">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              className="bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-500 focus-visible:ring-blue-500"
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button
            type="submit"
            disabled={isPending}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isPending ? "Signing in..." : "Log in"}
          </Button>
          <p className="text-sm text-slate-400 text-center">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-blue-400 hover:text-blue-300 underline">
              Register
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
      <Suspense fallback={
        <Card className="w-full max-w-md bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-2xl text-slate-100">Welcome back</CardTitle>
          </CardHeader>
        </Card>
      }>
        <LoginForm />
      </Suspense>
    </div>
  );
}
