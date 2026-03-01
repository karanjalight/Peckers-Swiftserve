import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileQuestion, LayoutDashboard, MapPin } from "lucide-react";

export default function MrVisitNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md border-slate-200">
        <CardContent className="flex flex-col items-center pt-8 pb-8 text-center">
          <div className="rounded-full bg-slate-100 p-4">
            <FileQuestion className="h-10 w-10 text-slate-500" />
          </div>
          <h1 className="mt-4 text-xl font-semibold text-slate-900">
            Visit not found
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            This visit doesn&apos;t exist, was removed, or you don&apos;t have
            access to it.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild className="gap-2 bg-[#1e3a5f] hover:bg-[#2563eb]">
              <Link href="/mr/dashboard">
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>
            </Button>
            <Button asChild variant="outline" className="gap-2">
              <Link href="/mr/pharmacies">
                <MapPin className="h-4 w-4" />
                Pharmacies
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
