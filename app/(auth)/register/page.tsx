"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { registerUser } from "@/lib/actions/auth";

const initialState = { errors: {} };

export default function RegisterPage() {
  const [state, formAction, isPending] = useActionState(registerUser, initialState);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
      <Card className="w-full max-w-md bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-2xl text-slate-100">Create an account</CardTitle>
          <CardDescription className="text-slate-400">
            Enter your details below to register
          </CardDescription>
        </CardHeader>
        <form action={formAction}>
          <CardContent className="space-y-4">
            {state.errors?.general && (
              <p className="text-sm text-red-400">{state.errors.general}</p>
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
              {state.errors?.username && (
                <p className="text-sm text-red-400">{state.errors.username}</p>
              )}
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
              {state.errors?.password && (
                <p className="text-sm text-red-400">{state.errors.password}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="confirmPassword" className="text-slate-300">Confirm Password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="••••••••"
                className="bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-500 focus-visible:ring-blue-500"
              />
              {state.errors?.confirmPassword && (
                <p className="text-sm text-red-400">{state.errors.confirmPassword}</p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button
              type="submit"
              disabled={isPending}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isPending ? "Creating account..." : "Register"}
            </Button>
            <p className="text-sm text-slate-400 text-center">
              Already have an account?{" "}
              <Link href="/login" className="text-blue-400 hover:text-blue-300 underline">
                Log in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
