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
    <Card className="w-full max-w-md bg-card border-border">
      <CardHeader>
        <CardTitle className="text-2xl text-foreground">Welcome back</CardTitle>
        <CardDescription className="text-muted-foreground">
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
            <Label htmlFor="username" className="text-foreground">Username</Label>
            <Input
              id="username"
              name="username"
              type="text"
              placeholder="your_username"
              className="bg-secondary border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-ring"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="password" className="text-foreground">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              className="bg-secondary border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-ring"
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
          <p className="text-sm text-muted-foreground text-center">
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
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Suspense fallback={
        <Card className="w-full max-w-md bg-card border-border">
          <CardHeader>
            <CardTitle className="text-2xl text-foreground">Welcome back</CardTitle>
          </CardHeader>
        </Card>
      }>
        <LoginForm />
      </Suspense>
    </div>
  );
}
