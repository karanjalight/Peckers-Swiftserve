"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Package,
  Layers,
  Stethoscope,
  ExternalLink,
  TrendingUp,
  Building2,
  Hash,
  AlertCircle,
  Check,
  X,
} from "lucide-react";

type ProductAudit = {
  id: string;
  quantity_in_stock: number;
  usp_understood: boolean;
  reason_why_stock?: string | null;
  supplier?: string | null;
  quantity_sold_good_month?: number | null;
  price_per_pack?: number | null;
  days_oos?: number | null;
  reason_for_oos?: string | null;
  do_substitute?: boolean;
  substitute_with_and_why?: string | null;
  mr_products: { name: string } | { name: string }[] | null;
  mr_competitor_audits: Array<{
    competitor_name: string;
    supplier?: string | null;
    competitor_stock?: number | null;
    stock_sold_per_month?: number | null;
    substitution_reason?: string | null;
    price_per_pack?: number | null;
    days_out?: number | null;
    reason_out_of_stock?: string | null;
    doctor_prescribing?: string | null;
    doctor_location?: string | null;
    rx_per_month?: number | null;
  }>;
};

type PrescriptionAudit = {
  product_name: string;
  rx_per_month?: number | null;
  prescription_image_url?: string | null;
  mr_doctors: { name: string; location: string | null } | { name: string; location: string | null }[] | null;
};

function getProductName(pa: ProductAudit): string {
  const mp = pa.mr_products;
  const p = Array.isArray(mp) ? mp[0] : mp;
  return p?.name ?? "Product";
}

function getDoctor(p: PrescriptionAudit) {
  const d = p.mr_doctors;
  return Array.isArray(d) ? d[0] : d;
}

export function MrVisitProductDetailTabs({
  productAudits,
  prescriptionAudits,
}: {
  productAudits: ProductAudit[];
  prescriptionAudits: PrescriptionAudit[];
}) {
  const [activeTab, setActiveTab] = useState(productAudits[0]?.id ?? "");

  if (productAudits.length === 0) return null;

  return (
    <Card className="overflow-hidden border-slate-200 shadow-md dark:border-slate-700">
      <CardHeader className="space-y-2 border-0 bg-blue-900 px-5 py-5 sm:px-6 sm:py-6">
        <CardTitle className="flex items-center gap-2 text-lg font-bold text-white sm:text-xl">
          <Package className="h-5 w-5 text-blue-200" />
          Products & audit details
        </CardTitle>
        <p className="text-sm text-blue-200/90">
          Select a product to see stock, competitors, and prescriptions for that product.
        </p>
      </CardHeader>
      <CardContent className="border-t border-slate-200 p-0 dark:border-slate-700">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="border-b border-slate-200 bg-slate-50 px-3 pt-3 dark:border-slate-700 dark:bg-slate-900/30">
            <TabsList className="h-auto w-full flex-wrap justify-start gap-2 rounded-xl bg-slate-200/80 p-2 dark:bg-slate-800/60">
              {productAudits.map((pa) => {
                const name = getProductName(pa);
                return (
                  <TabsTrigger
                    key={pa.id}
                    value={pa.id}
                    className="rounded-lg px-4 py-2.5 text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-700"
                  >
                    {name}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>
          {productAudits.map((pa) => {
            const productName = getProductName(pa);
            const competitors = Array.isArray(pa.mr_competitor_audits) ? pa.mr_competitor_audits : [];
            const prescriptions = prescriptionAudits.filter(
              (p) => (p.product_name ?? "").trim().toLowerCase() === productName.trim().toLowerCase()
            );
            return (
              <TabsContent key={pa.id} value={pa.id} className="m-0 outline-none">
                <div className="space-y-6 p-4 sm:p-6">
                  {/* Stock & pharmacy - prominent */}
                  <section>
                    <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      <Layers className="h-4 w-4" />
                      Stock & pharmacy
                    </h3>
                    <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-700 dark:bg-slate-800/30 sm:p-5">
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <div className="rounded-lg bg-white p-3 shadow-sm ring-1 ring-slate-200/60 dark:bg-slate-900/50 dark:ring-slate-600/40">
                          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Quantity in stock</p>
                          <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">
                            {pa.quantity_in_stock ?? "—"}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">packs</p>
                        </div>
                        <div className="rounded-lg bg-white p-3 shadow-sm ring-1 ring-slate-200/60 dark:bg-slate-900/50 dark:ring-slate-600/40">
                          <p className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                            <TrendingUp className="h-3.5 w-3.5" />
                            Sold in a good month
                          </p>
                          <p className="mt-1 text-xl font-semibold text-slate-900 dark:text-slate-100">
                            {pa.quantity_sold_good_month ?? "—"}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">packs</p>
                        </div>
                        <div className="rounded-lg bg-white p-3 shadow-sm ring-1 ring-slate-200/60 dark:bg-slate-900/50 dark:ring-slate-600/40">
                          <p className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                            <Building2 className="h-3.5 w-3.5" />
                            Supplier
                          </p>
                          <p className="mt-1 truncate text-lg font-medium text-slate-900 dark:text-slate-100">
                            {pa.supplier ?? "—"}
                          </p>
                        </div>
                        <div className="rounded-lg bg-white p-3 shadow-sm ring-1 ring-slate-200/60 dark:bg-slate-900/50 dark:ring-slate-600/40">
                          <p className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                            <Hash className="h-3.5 w-3.5" />
                            Price per pack
                          </p>
                          <p className="mt-1 text-lg font-medium text-slate-900 dark:text-slate-100">
                            {pa.price_per_pack != null ? `KES ${pa.price_per_pack}` : "—"}
                          </p>
                        </div>
                        <div className="rounded-lg bg-white p-3 shadow-sm ring-1 ring-slate-200/60 dark:bg-slate-900/50 dark:ring-slate-600/40">
                          <p className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                            <AlertCircle className="h-3.5 w-3.5" />
                            Days out of stock
                          </p>
                          <p className="mt-1 text-lg font-medium text-slate-900 dark:text-slate-100">
                            {pa.days_oos ?? "—"}
                          </p>
                        </div>
                        <div className="rounded-lg bg-white p-3 shadow-sm ring-1 ring-slate-200/60 dark:bg-slate-900/50 dark:ring-slate-600/40">
                          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">USP understood</p>
                          <p className="mt-1 flex items-center gap-1.5 text-lg font-medium">
                            {pa.usp_understood ? (
                              <><Check className="h-5 w-5 text-emerald-600 dark:text-emerald-400" /> Yes</>
                            ) : (
                              <><X className="h-5 w-5 text-slate-400" /> No</>
                            )}
                          </p>
                        </div>
                      </div>
                      {(pa.reason_why_stock || pa.reason_for_oos || pa.do_substitute || pa.substitute_with_and_why) && (
                        <div className="mt-4 space-y-2 border-t border-slate-200 pt-4 dark:border-slate-600">
                          {pa.reason_why_stock && (
                            <div>
                              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Reason they stock</p>
                              <p className="text-sm text-slate-700 dark:text-slate-300">{pa.reason_why_stock}</p>
                            </div>
                          )}
                          {pa.reason_for_oos && (
                            <div>
                              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Reason for OOS</p>
                              <p className="text-sm text-slate-700 dark:text-slate-300">{pa.reason_for_oos}</p>
                            </div>
                          )}
                          {pa.do_substitute && (
                            <div>
                              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Substitute with & why</p>
                              <p className="text-sm text-slate-700 dark:text-slate-300">{pa.substitute_with_and_why ?? "—"}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </section>

                  {/* Competitors */}
                  {competitors.length > 0 && (
                    <section>
                      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        <Layers className="h-4 w-4" />
                        Competitors ({competitors.length})
                      </h3>
                      <ul className="space-y-2">
                        {competitors.map((c, i) => (
                          <li
                            key={i}
                            className="flex flex-wrap items-start gap-x-3 gap-y-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900/40"
                          >
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                              <span className="font-medium text-slate-900 dark:text-slate-100">{c.competitor_name}</span>
                              {c.supplier && <span className="text-slate-600 dark:text-slate-400">{c.supplier}</span>}
                              {c.competitor_stock != null && (
                                <span className="text-slate-600 dark:text-slate-400">Stock: {c.competitor_stock}</span>
                              )}
                              {c.stock_sold_per_month != null && (
                                <span className="text-slate-600 dark:text-slate-400">{c.stock_sold_per_month}/mo</span>
                              )}
                              {c.price_per_pack != null && (
                                <span className="text-slate-600 dark:text-slate-400">KES {c.price_per_pack}</span>
                              )}
                            </div>
                            {(c.doctor_prescribing || c.doctor_location != null || c.rx_per_month != null) && (
                              <div className="w-full border-t border-slate-100 pt-2 mt-1 dark:border-slate-700">
                                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Doctor prescribing: </span>
                                <span className="text-slate-700 dark:text-slate-300">{c.doctor_prescribing ?? "—"}</span>
                                {c.doctor_location && <span className="text-slate-600 dark:text-slate-400"> · {c.doctor_location}</span>}
                                {c.rx_per_month != null && <span className="text-slate-600 dark:text-slate-400"> · {c.rx_per_month} Rx/mo</span>}
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}

                  {/* Prescriptions for this product */}
                  <section>
                    <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      <Stethoscope className="h-4 w-4" />
                      Prescriptions ({prescriptions.length})
                    </h3>
                    {prescriptions.length > 0 ? (
                      <ul className="space-y-3">
                        {prescriptions.map((p, i) => {
                          const doc = getDoctor(p);
                          return (
                            <li
                              key={i}
                              className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/40"
                            >
                              <p className="font-medium text-slate-900 dark:text-slate-100">{doc?.name ?? "—"}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">{doc?.location ?? "—"}</p>
                              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
                                <span className="text-slate-600 dark:text-slate-400">
                                  {p.rx_per_month != null ? `${p.rx_per_month} Rx/month` : "—"}
                                </span>
                                {p.prescription_image_url && (
                                  <a
                                    href={p.prescription_image_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-slate-700 underline hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100"
                                  >
                                    <ExternalLink className="h-3.5 w-3.5" />
                                    View image
                                  </a>
                                )}
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800/30 dark:text-slate-400">
                        No prescriptions recorded for this product.
                      </p>
                    )}
                  </section>
                </div>
              </TabsContent>
            );
          })}
        </Tabs>
      </CardContent>
    </Card>
  );
}
