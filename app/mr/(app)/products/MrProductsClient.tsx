"use client";

import Link from "next/link";
import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  createMrProduct,
  updateMrProduct,
  deleteMrProduct,
} from "@/app/mr/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Package,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  CircleDot,
} from "lucide-react";
import type { MrProductRow } from "./page";

const inputClass =
  "h-11 rounded-lg border border-slate-200 bg-white px-3.5 text-sm shadow-sm transition-colors placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20";

export function MrProductsClient({
  products,
}: {
  products: MrProductRow[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "company" | "competitor">(
    "all"
  );
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editing, setEditing] = useState<MrProductRow | null>(null);
  const [deleting, setDeleting] = useState<MrProductRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  const [createForm, setCreateForm] = useState({
    name: "",
    sku: "",
    isCompanyProduct: true,
    price: "" as string | number,
    ownedBy: "",
  });
  const [editForm, setEditForm] = useState({
    name: "",
    sku: "",
    isCompanyProduct: true,
    price: "" as string | number,
    ownedBy: "",
  });

  const filtered = useMemo(() => {
    let list = products;
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.sku && p.sku.toLowerCase().includes(q))
      );
    }
    if (typeFilter === "company") {
      list = list.filter((p) => p.is_company_product);
    } else if (typeFilter === "competitor") {
      list = list.filter((p) => !p.is_company_product);
    }
    return list;
  }, [products, search, typeFilter]);

  const catalogStats = useMemo(() => {
    const company = products.filter((p) => p.is_company_product).length;
    return {
      total: products.length,
      company,
      competitor: products.length - company,
    };
  }, [products]);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const pageItems = filtered.slice(startIndex, endIndex);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const result = await createMrProduct({
      name: createForm.name,
      sku: createForm.sku || null,
      isCompanyProduct: createForm.isCompanyProduct,
      price: createForm.price ? parseFloat(String(createForm.price)) : null,
      ownedBy: createForm.ownedBy || null,
    });
    setLoading(false);
    if (result.success) {
      setCreateOpen(false);
      setCreateForm({ name: "", sku: "", isCompanyProduct: true, price: "", ownedBy: "" });
      router.refresh();
      setMessage({ type: "success", text: "Product created." });
    } else {
      setMessage({ type: "error", text: result.error ?? "Failed" });
    }
  }

  function openEdit(p: MrProductRow) {
    setEditing(p);
    setEditForm({
      name: p.name,
      sku: p.sku ?? "",
      isCompanyProduct: p.is_company_product,
      price: p.price ?? "",
      ownedBy: p.owned_by ?? "",
    });
    setEditOpen(true);
    setMessage(null);
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setLoading(true);
    setMessage(null);
    const result = await updateMrProduct(editing.id, {
      name: editForm.name,
      sku: editForm.sku || null,
      isCompanyProduct: editForm.isCompanyProduct,
      price: editForm.price ? parseFloat(String(editForm.price)) : null,
      ownedBy: editForm.ownedBy || null,
    });
    setLoading(false);
    if (result.success) {
      setEditOpen(false);
      setEditing(null);
      router.refresh();
      setMessage({ type: "success", text: "Product updated." });
    } else {
      setMessage({ type: "error", text: result.error ?? "Failed" });
    }
  }

  function openDelete(p: MrProductRow) {
    setDeleting(p);
    setDeleteOpen(true);
  }

  function formatReference(id: string) {
    const short = id.replace(/-/g, "").slice(0, 8).toUpperCase();
    return `PRD-${short}`;
  }

  function formatCreated(iso: string) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return { top: "—", bottom: "" };
    return {
      top: format(d, "dd MMM yyyy"),
      bottom: format(d, "HH:mm"),
    };
  }

  function handleChangePage(next: number) {
    startTransition(() => setPage(next));
  }

  async function handleDelete() {
    if (!deleting) return;
    setLoading(true);
    setMessage(null);
    const result = await deleteMrProduct(deleting.id);
    setLoading(false);
    if (result.success) {
      setDeleteOpen(false);
      setDeleting(null);
      router.refresh();
      setMessage({ type: "success", text: "Product deleted." });
    } else {
      setMessage({ type: "error", text: result.error ?? "Failed" });
    }
  }

  return (
    <div className="space-y-6">
      {message && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            message.type === "error"
              ? "border-red-200 bg-red-50 text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200"
              : "border-green-200 bg-green-50 text-green-800 dark:border-green-900/50 dark:bg-green-950/40 dark:text-green-200"
          }`}
        >
          {message.text}
        </div>
      )}

      <Card className="border-none bg-transparent shadow-none">
        <CardContent className="space-y-4 p-0">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="flex flex-col gap-1 rounded-2xl border border-slate-400 bg-white/90 p-4 shadow-sm backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/90">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                <Package className="h-3.5 w-3.5" />
                Total products
              </span>
              <span className="text-2xl font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                {catalogStats.total}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">In catalog</span>
            </div>
            <div className="flex flex-col gap-1 rounded-2xl border border-slate-400 bg-white/90 p-4 shadow-sm backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/90">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                Company
              </span>
              <span className="text-2xl font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                {catalogStats.company}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">Own brand SKUs</span>
            </div>
            <div className="flex flex-col gap-1 rounded-2xl border border-slate-400 bg-white/90 p-4 shadow-sm backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/90">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                <CircleDot className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                Competitor
              </span>
              <span className="text-2xl font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                {catalogStats.competitor}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">Tracked alternatives</span>
            </div>
          </div>

          <div className="flex flex-col gap-3 rounded-2xl border border-slate-400 bg-white/90 p-3 shadow-sm backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/90 sm:flex-row sm:items-center sm:justify-between sm:p-4">
            <div className="space-y-1">
              <p className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                Products
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {filtered.length} of {products.length} product{products.length !== 1 ? "s" : ""}{" "}
                shown
              </p>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:max-w-3xl sm:flex-1 sm:flex-row sm:items-center sm:justify-end">
              <Button
                type="button"
                onClick={() => {
                  setCreateOpen(true);
                  setMessage(null);
                }}
                className="h-9 shrink-0 gap-2 rounded-2xl bg-blue-900 px-4 text-sm text-white hover:bg-blue-800 dark:bg-blue-800 dark:hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                Add product
              </Button>
              <div className="relative min-w-0 flex-1 sm:max-w-md">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  type="search"
                  placeholder="Search by name or SKU"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="h-9 w-full rounded-2xl border-slate-500 bg-slate-50 pl-9 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:ring-0 dark:border-slate-600 dark:bg-slate-800 dark:text-white lg:h-12"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 shrink-0 text-slate-400" />
                <select
                  value={typeFilter}
                  onChange={(e) => {
                    setTypeFilter(e.target.value as "all" | "company" | "competitor");
                    setPage(1);
                  }}
                  className="h-9 w-full min-w-[10rem] rounded-2xl border border-slate-500 bg-slate-50 px-3 text-sm text-slate-900 focus:outline-none focus:ring-0 dark:border-slate-600 dark:bg-slate-800 dark:text-white lg:h-12"
                >
                  <option value="all">All types</option>
                  <option value="company">Company</option>
                  <option value="competitor">Competitor</option>
                </select>
              </div>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="flex min-h-[220px] flex-col items-center justify-center rounded-lg border border-dashed border-slate-400 bg-slate-50/60 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-300">
              <div className="rounded-full bg-slate-200 p-4 dark:bg-slate-700">
                <Package className="h-8 w-8 text-slate-600 dark:text-slate-300" />
              </div>
              <p className="mt-2 max-w-sm px-4">
                {products.length === 0
                  ? "No products yet. Add one to get started."
                  : "No products match your filters."}
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-400 bg-white text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50">
              <div className="overflow-auto">
                <Table className="rounded-b-2xl">
                  <TableHeader>
                    <TableRow className="sticky top-0 z-10 rounded-t-2xl bg-[#071b5f] hover:bg-[#071b5f] text-xs font-semibold uppercase tracking-wide text-white">
                      <TableHead className="min-w-[120px] border-none py-8 pl-3 text-white">
                        Reference
                      </TableHead>
                      <TableHead className="min-w-[200px] border-none text-white">Name</TableHead>
                      <TableHead className="min-w-[110px] border-none text-white">SKU</TableHead>
                      <TableHead className="min-w-[120px] border-none text-white">Type</TableHead>
                      <TableHead className="min-w-[120px] border-none text-white">
                        Price (KES)
                      </TableHead>
                      <TableHead className="min-w-[140px] border-none text-white">Owned by</TableHead>
                      <TableHead className="min-w-[130px] border-none text-white">Created</TableHead>
                      <TableHead className="min-w-[150px] border-none text-center text-white">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pageItems.map((p) => {
                      const created = formatCreated(p.created_at);
                      return (
                        <TableRow
                          key={p.id}
                          className="border-b border-slate-400 text-sm text-slate-800 hover:bg-slate-50/80 dark:border-slate-800 dark:text-slate-100 dark:hover:bg-slate-800/70"
                        >
                          <TableCell className="py-6 font-medium text-slate-900 dark:text-white">
                            {formatReference(p.id)}
                          </TableCell>
                          <TableCell className="text-lg">
                            <div className="flex flex-col">
                              <Link
                                href={`/mr/products/${p.id}`}
                                className="line-clamp-2 font-medium text-blue-900 hover:underline dark:text-blue-300"
                              >
                                {p.name}
                              </Link>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm text-slate-600 dark:text-slate-300">
                            {p.sku ?? "—"}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`inline-flex min-w-[88px] items-center justify-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold ${
                                p.is_company_product
                                  ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-200 dark:ring-emerald-900"
                                  : "bg-amber-50 text-amber-700 ring-1 ring-amber-100 dark:bg-amber-900/40 dark:text-amber-200 dark:ring-amber-900"
                              }`}
                            >
                              <CheckCircle2 className="h-3 w-3" />
                              {p.is_company_product ? "Company" : "Competitor"}
                            </span>
                          </TableCell>
                          <TableCell className="font-medium text-slate-700 dark:text-slate-200">
                            {p.price != null ? `KES ${p.price}` : "—"}
                          </TableCell>
                          <TableCell className="text-sm text-slate-600 dark:text-slate-300">
                            {p.owned_by ?? "—"}
                          </TableCell>
                          <TableCell className="text-sm text-slate-700 dark:text-slate-200">
                            <div className="flex flex-col">
                              <span>{created.top}</span>
                              {created.bottom && (
                                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                  {created.bottom}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                              <Button
                                asChild
                                variant="default"
                                size="sm"
                                className="h-8 rounded-full bg-blue-900 px-3 text-xs text-white hover:bg-blue-800"
                              >
                                <Link href={`/mr/products/${p.id}`} aria-label="View product">
                                  <Eye className="h-4 w-4" />
                                </Link>
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-8 rounded-full border-slate-300 px-3 text-xs font-medium text-slate-700 hover:bg-white dark:border-slate-600 dark:text-slate-100 dark:hover:bg-slate-800"
                                onClick={() => openEdit(p)}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => openDelete(p)}
                                className="h-8 rounded-full bg-white px-2 text-xs text-red-600 ring-1 ring-red-200 hover:bg-red-50 dark:bg-slate-900 dark:text-red-300 dark:ring-red-900/60 dark:hover:bg-red-950/30"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-4">
                  <span>
                    Showing{" "}
                    <span className="font-semibold">
                      {filtered.length === 0 ? 0 : startIndex + 1}-
                      {Math.min(endIndex, filtered.length)}
                    </span>{" "}
                    of <span className="font-semibold">{filtered.length}</span>
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Rows per page:
                    </span>
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        const next = Number(e.target.value) || 25;
                        setPageSize(next);
                        setPage(1);
                      }}
                      className="h-8 rounded-full border border-slate-300 bg-white px-2 text-[11px] font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    >
                      {[25, 50, 100, 300, 500, 1000].map((size) => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => handleChangePage(Math.max(1, page - 1))}
                    className="rounded-full border-slate-300 px-6 py-4 text-xs font-medium text-slate-700 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800"
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-slate-800 dark:text-slate-400">
                    Page <span className="font-semibold">{page}</span> of{" "}
                    <span className="font-semibold">{totalPages}</span>
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={page === totalPages || filtered.length === 0}
                    onClick={() => handleChangePage(Math.min(totalPages, page + 1))}
                    className="rounded-full border-slate-300 px-6 py-4 text-xs font-medium text-slate-700 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800"
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-teal-600" />
              Add product
            </DialogTitle>
            <DialogDescription>
              Products appear in the MR audit form during pharmacy visits.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="create-name">Name</Label>
              <Input
                id="create-name"
                className={inputClass}
                value={createForm.name}
                onChange={(e) =>
                  setCreateForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="e.g. Floranorm Sachets (10's)"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-sku">SKU (optional)</Label>
              <Input
                id="create-sku"
                className={inputClass}
                value={createForm.sku}
                onChange={(e) =>
                  setCreateForm((f) => ({ ...f, sku: e.target.value }))
                }
                placeholder="e.g. FLR-001"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="create-company"
                checked={createForm.isCompanyProduct}
                onChange={(e) =>
                  setCreateForm((f) => ({
                    ...f,
                    isCompanyProduct: e.target.checked,
                  }))
                }
                className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
              />
              <Label htmlFor="create-company" className="cursor-pointer font-normal">
                Company product (uncheck for competitor)
              </Label>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="bg-teal-600 hover:bg-teal-700">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  "Create"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5 text-teal-600" />
              Edit product
            </DialogTitle>
            <DialogDescription>
              Changes will apply to future visits; existing audit data is unchanged.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                className={inputClass}
                value={editForm.name}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, name: e.target.value }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-sku">SKU (optional)</Label>
              <Input
                id="edit-sku"
                className={inputClass}
                value={editForm.sku}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, sku: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-price">Price (KES)</Label>
              <Input
                id="edit-price"
                type="number"
                min={0}
                step="0.01"
                className={inputClass}
                value={editForm.price}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, price: e.target.value }))
                }
                placeholder="e.g. 400"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-ownedBy">Owned by</Label>
              <Input
                id="edit-ownedBy"
                className={inputClass}
                value={editForm.ownedBy}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, ownedBy: e.target.value }))
                }
                placeholder="e.g. Company, Brand name"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="edit-company"
                checked={editForm.isCompanyProduct}
                onChange={(e) =>
                  setEditForm((f) => ({
                    ...f,
                    isCompanyProduct: e.target.checked,
                  }))
                }
                className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
              />
              <Label htmlFor="edit-company" className="cursor-pointer font-normal">
                Company product (uncheck for competitor)
              </Label>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="bg-teal-600 hover:bg-teal-700">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  "Save"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirm dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-700">
              <Trash2 className="h-5 w-5" />
              Delete product
            </DialogTitle>
            <DialogDescription>
              {deleting && (
                <>
                  Delete <strong>{deleting.name}</strong>? This cannot be undone.
                  Existing product audits that reference this product may be affected.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={loading}
              onClick={handleDelete}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting…
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
