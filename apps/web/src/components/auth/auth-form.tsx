"use client";

import { Eye, EyeOff, KeyRound } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { AuthModeToggle, AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

function passwordChecks(password: string) {
  return {
    uppercase: /[A-Z]/.test(password),
    length: password.length >= 10,
    digits: (password.match(/\d/g) ?? []).length >= 2,
    symbol: /[^A-Za-z0-9]/.test(password),
  };
}

function RequirementRow({ met, label }: { met: boolean; label: string }) {
  return (
    <li
      className={cn(
        "flex items-center gap-2 text-sm",
        met ? "text-green-600 dark:text-green-500" : "text-destructive",
      )}
    >
      <span
        className={cn(
          "flex size-4 shrink-0 items-center justify-center text-xs font-bold",
          met ? "text-green-600 dark:text-green-500" : "text-destructive",
        )}
        aria-hidden="true"
      >
        {met ? "✓" : "×"}
      </span>
      {label}
    </li>
  );
}

export default function AuthForm({ initialMode = "login" }: { initialMode?: "login" | "signup" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/dashboard";

  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  const checks = useMemo(() => passwordChecks(password), [password]);
  const passwordValid =
    checks.uppercase && checks.length && checks.digits && checks.symbol;

  async function handleGoogleAuth() {
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const callbackRedirect =
      mode === "signup"
        ? `${window.location.origin}/auth/callback?redirect=/permission-approval`
        : `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirect)}`;

    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callbackRedirect },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const supabase = createClient();

    if (mode === "login") {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      router.push(redirect);
      router.refresh();
      return;
    }

    if (!acceptedTerms) {
      setError("Please accept the Terms and Conditions.");
      setLoading(false);
      return;
    }

    if (!passwordValid) {
      setError("Please meet all password requirements.");
      setLoading(false);
      return;
    }

    const fullName = [firstName.trim(), lastName.trim()].filter(Boolean).join(" ");

    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          phone: phone.trim() || null,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback?redirect=/permission-approval`,
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    setSuccess(
      "Account created. Check your email to confirm, or wait for admin approval after signing in.",
    );
    setLoading(false);
  }

  return (
    <AuthShell>
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-6">
        <Link href="/" className="mb-8 text-2xl font-bold tracking-tight text-[#1e4fd6]">
          Sales Pipeline
        </Link>

        <div className="mb-8">
          <AuthModeToggle mode={mode} onModeChange={setMode} />
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">
            {mode === "login" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {mode === "login"
              ? "Enter your details below to access your workspace."
              : "Enter your details below to register your account."}
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          className="mb-6 h-11 w-full justify-center gap-2 rounded-lg border-border bg-background text-sm font-medium"
          onClick={handleGoogleAuth}
          disabled={loading}
        >
          <GoogleIcon className="size-5" />
          {mode === "login" ? "Continue with Google" : "Register with Google"}
        </Button>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="lastName">Last name</Label>
                <Input
                  id="lastName"
                  placeholder="e.g. Smith"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="h-11 rounded-lg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="firstName">First name</Label>
                <Input
                  id="firstName"
                  placeholder="e.g. Jane"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="h-11 rounded-lg"
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-11 rounded-lg"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <KeyRound className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={mode === "signup" ? 10 : 6}
                className="h-11 rounded-lg pr-10 pl-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {mode === "signup" && (
              <ul className="mt-2 space-y-1">
                <RequirementRow met={checks.uppercase} label="Must have a capital letter" />
                <RequirementRow met={checks.length} label="Must have at least 10 characters" />
                <RequirementRow met={checks.digits} label="Must have at least 2 digits" />
                <RequirementRow met={checks.symbol} label="Must have a symbol" />
              </ul>
            )}
          </div>

          {mode === "signup" && (
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+44"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-11 rounded-lg"
              />
            </div>
          )}

          {mode === "signup" && (
            <div className="flex items-start gap-3 pt-1">
              <Checkbox
                id="terms"
                checked={acceptedTerms}
                onCheckedChange={setAcceptedTerms}
                className="mt-0.5"
              />
              <Label htmlFor="terms" className="text-sm leading-snug font-normal">
                I accept the Terms and Conditions
              </Label>
            </div>
          )}

          {error && (
            <p className="text-destructive text-sm" role="alert">
              {error}
            </p>
          )}
          {success && (
            <p className="text-sm text-green-600 dark:text-green-400" role="status">
              {success}
            </p>
          )}

          <Button
            type="submit"
            disabled={loading || (mode === "signup" && !passwordValid)}
            className="h-11 w-full rounded-lg bg-foreground text-background hover:bg-foreground/90"
          >
            {loading
              ? mode === "login"
                ? "Signing in..."
                : "Creating account..."
              : mode === "login"
                ? "Log in"
                : "Register now"}
          </Button>
        </form>
      </div>
    </AuthShell>
  );
}
