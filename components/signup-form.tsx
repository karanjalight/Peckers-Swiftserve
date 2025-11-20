"use client";

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
import { AlertCircle, CheckCircle } from "lucide-react";

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
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        throw new Error(signUpError.message || "Signup failed");
      }

      if (!authData.user?.id) {
        throw new Error("Failed to create account");
      }

      console.log("✅ Auth user created:", authData.user.email);

      // Create a simple hash for password_hash field
      const passwordHash = `$2a$10$${Buffer.from(password).toString('base64').substring(0, 53)}`;

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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <div className="flex flex-col items-center gap-2 text-center">
              <h1 className="text-4xl md:text-5xl font-bold text-[#244672] my-3">
                Create Account
              </h1>
              <FieldDescription>
                Already have an account?{" "}
                <a href="/login" className="text-green-600 hover:underline font-medium">
                  Sign in
                </a>
              </FieldDescription>
            </div>

            <Field>
              <FieldLabel>Full Name</FieldLabel>
              <Input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
                className="py-5 border border-gray-400 rounded-none"
                required
                disabled={loading || success}
              />
            </Field>

            <Field>
              <FieldLabel>Email</FieldLabel>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="m@example.com"
                className="py-5 border border-gray-400 rounded-none"
                required
                disabled={loading || success}
              />
            </Field>

            <Field>
              <FieldLabel>Phone (Optional)</FieldLabel>
              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+254 712 345 678"
                className="py-5 border border-gray-400 rounded-none"
                disabled={loading || success}
              />
            </Field>

            <Field>
              <FieldLabel>Password</FieldLabel>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="py-5 border border-gray-400 rounded-none"
                placeholder="At least 8 characters"
                required
                disabled={loading || success}
              />
              <FieldDescription className="text-xs text-slate-500 mt-1">
                Password must be at least 8 characters long
              </FieldDescription>
            </Field>

            <Field>
              <FieldLabel>Confirm Password</FieldLabel>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="py-5 border border-gray-400 rounded-none"
                placeholder="Re-enter your password"
                required
                disabled={loading || success}
              />
            </Field>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {success && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded flex items-center gap-2">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                Account created successfully! Redirecting to login...
              </div>
            )}

            <Field>
              <Button
                className="py-5 text-lg bg-[#33B200] hover:bg-[#2a9500] w-full"
                type="submit"
                disabled={loading || success}
              >
                {loading ? "Creating Account..." : success ? "Account Created!" : "Sign Up"}
              </Button>
            </Field>

            {/* <FieldSeparator>Or</FieldSeparator>

            <Field className="grid gap-4 sm:grid-cols-1">
              <Button
                variant="outline"
                className="border border-gray-300 py-5"
                type="button"
                disabled={loading || success}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  className="w-5 h-5 mr-2"
                >
                  <path
                    d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                    fill="currentColor"
                  />
                </svg>
                Continue with Google
              </Button>
            </Field> */}

            <FieldDescription className="px-6 text-center text-xs">
              By signing up, you agree to our <br />{" "}
              <a href="#" className="hover:underline">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="#" className="hover:underline">
                Privacy Policy
              </a>
              .
            </FieldDescription>
          </FieldGroup>
        </form>
      </div>
    </div>
  );
}