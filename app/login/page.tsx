import { LoginForm } from "@/components/login-form"

export default function LoginPage() {
  return (
    <div className="bg-backgro und bg-[#b38f62]/30 flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="w-full mx-auto max-w-5xl lg:mx-40">
        <LoginForm />
      </div>
    </div>
  )
}
