import { redirect } from "next/navigation";
import { getMrAuth } from "@/lib/mr/supabase-server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MapPin } from "lucide-react";

export default async function MrHomePage() {
  const auth = await getMrAuth();
  if (auth.error) redirect("/mr/login");

  const isManager =
    auth.profile.role === "MANAGER" || auth.profile.role === "ADMIN";

  if (isManager) {
    redirect("/mr/dashboard");
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Welcome, {auth.profile.full_name}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Start a pharmacy visit to capture audits and prescriptions.
        </p>
      </div>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin className="h-4 w-4" />
            Get Started
          </CardTitle>
          <CardDescription>
            Select an assigned pharmacy to check in and record your visit.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/mr/pharmacies">View Assigned Pharmacies</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
