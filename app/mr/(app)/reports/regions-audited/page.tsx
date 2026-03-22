import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getMrAuth } from "@/lib/mr/supabase-server";
import { loadPresentationReports } from "@/lib/mr/load-presentation-reports";
import { RegionsAuditedReportCard } from "@/components/mr/presentation/PresentationReportSections";
import { Button } from "@/components/ui/button";

export default async function RegionsAuditedReportPage() {
  const auth = await getMrAuth();
  if (auth.error) redirect("/mr/login");

  const data = await loadPresentationReports(auth.supabase);

  return (
    <div className="w-full space-y-6">
      <Button variant="ghost" size="sm" className="-ml-1 w-fit" asChild>
        <Link href="/mr/reports" className="gap-1.5">
          <ChevronLeft className="h-4 w-4" />
          Back to Reports
        </Link>
      </Button>
      <RegionsAuditedReportCard regionalAuditSummary={data.regionalAuditSummary} />
    </div>
  );
}
