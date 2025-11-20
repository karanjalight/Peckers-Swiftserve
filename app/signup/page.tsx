"use client";
import { cn } from "@/lib/utils";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { AlertCircle, CheckCircle, Eye, EyeOff } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

export default function SignupPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const validateForm = () => {
    if (!fullName.trim()) {
      setError("Full name is required");
      return false;
    }
    if (!email.includes("@")) {
      setError("Please enter a valid email");
      return false;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return false;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return false;
    }
    return true;
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      console.log("📤 Creating new account...");

      // Check if user already exists
      const { data: existingUser } = await supabase
        .from("users")
        .select("id")
        .eq("email", email)
        .single();

      if (existingUser) {
        throw new Error("Email already registered");
      }

      // Create auth user
      const { data: authData, error: signUpError } = await supabase.auth.signUp(
        {
          email,
          password,
        }
      );

      if (signUpError) {
        throw new Error(signUpError.message || "Signup failed");
      }

      if (!authData.user?.id) {
        throw new Error("Failed to create account");
      }

      console.log("✅ Auth user created:", authData.user.email);

      // Create a simple hash for password_hash field
      const passwordHash = `$2a$10$${Buffer.from(password)
        .toString("base64")
        .substring(0, 53)}`;

      // Create user record in users table
      const { error: userError } = await supabase.from("users").insert([
        {
          id: authData.user.id,
          full_name: fullName,
          email,
          phone: phone || null,
          role: "customer", // New signups are customers by default
          is_active: true,
          password_hash: passwordHash,
          is_email_verified: false,
          is_phone_verified: false,
        },
      ]);

      if (userError) {
        console.error("Error creating user record:", userError);
        throw new Error("Failed to create user account");
      }

      console.log("✅ User account created successfully");
      setSuccess(true);

      // Clear form
      setFullName("");
      setEmail("");
      setPhone("");
      setPassword("");
      setConfirmPassword("");

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push("/login?signup=success");
      }, 2000);
    } catch (err: any) {
      console.log("❌ Error:", err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-backgro und bg-[#b38f62]/30 flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <Card className="overflow-hidden w-full mx-auto max-w-5xl lg:mx-40 p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form onSubmit={handleSubmit} className="p-6 md:p-8">
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <Link href="/" className="flex items-center gap-2">
                  <img
                    src="/logo.png"
                    alt="Peckers Services Logo"
                    className="h-12 sm:h-14 lg:h-24 w-auto"
                  />
                </Link>
                <h1 className="text-2xl font-bold">Create Account</h1>
                <p className="text-muted-foreground text-balance">
                  Fill in your details to get started
                </p>
              </div>

              <Field>
                <FieldLabel htmlFor="fullName">Full Name</FieldLabel>
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  required
                  disabled={loading || success}
                />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="m@example.com"
                    required
                    disabled={loading || success}
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="phone">Phone (Optional)</FieldLabel>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+254 712 345 678"
                    disabled={loading || success}
                  />
                </Field>
              </div>

              <Field>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    required
                    disabled={loading || success}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground disabled:opacity-50"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <FieldDescription className="text-xs text-slate-500 mt-1">
                  Password must be at least 8 characters long
                </FieldDescription>
              </Field>

              <Field>
                <FieldLabel htmlFor="confirmPassword">
                  Confirm Password
                </FieldLabel>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    required
                    disabled={loading || success}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground disabled:opacity-50"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </Field>

              {error && (
                <div className="flex gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-md">
                  <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              {success && (
                <div className="flex gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-md">
                  <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-emerald-700">
                    Account created successfully! Redirecting...
                  </p>
                </div>
              )}

              <Field>
                <Button
                  type="submit"
                  disabled={loading || success}
                  className="w-full"
                >
                  {loading
                    ? "Creating Account..."
                    : success
                    ? "Account Created!"
                    : "Sign Up"}
                </Button>
              </Field>

              <FieldDescription className="text-center">
                Already have an account?{" "}
                <Link href="/login" className="font-semibold hover:underline">
                  Login
                </Link>
              </FieldDescription>
            </FieldGroup>
          </form>

          <div className="bg-muted relative hidden md:block">
            <img
              src="https://www.care.com/c/wp-content/uploads/sites/2/2022/07/GettyImages-1305309025.jpg"
              alt="Image"
              className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.9] dark:grayscale"
            />
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/50"></div>
          </div>
        </CardContent>
      </Card>

      <FieldDescription className="px-6 text-center">
        By clicking continue, you agree to our{" "}
        <Link href="/terms" className="hover:underline">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="hover:underline">
          Privacy Policy
        </Link>
        .
      </FieldDescription>
    </div>
  );
}
