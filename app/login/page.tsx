import { LoginForm } from "@/components/login-form"
import { Suspense } from "react"
import { Loader } from "lucide-react"

export default function LoginPage() {
  return (
    <div className="bg-backgro und bg-[#b38f62]/30 flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="w-full mx-auto max-w-5xl lg:mx-40">
        <Suspense
          fallback={
            <div className="min-h-svh flex items-center justify-center">
              <Loader className="w-6 h-6 animate-spin text-blue-700" />
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}
