/** Aligns with MR app roles (see MrSidebar). */
export type MrNavSearchRole = "MR" | "MANAGER" | "ADMIN";

export type MrNavSearchGroup = "main" | "reports" | "management";

export interface MrNavSearchItem {
  title: string;
  url: string;
  group: MrNavSearchGroup;
  /** If set, only these roles can see the item */
  roles?: MrNavSearchRole[];
  /** Extra strings to match (synonyms, fragments) */
  keywords?: string[];
}

const ALL_ITEMS: MrNavSearchItem[] = [
  {
    title: "Dashboard",
    url: "/mr/dashboard",
    group: "main",
    keywords: ["home", "overview", "stats"],
  },
  {
    title: "Pharmacies",
    url: "/mr/pharmacies",
    group: "main",
    keywords: ["chemist", "stores", "locations"],
  },
  {
    title: "New visit",
    url: "/mr/visit/create",
    group: "main",
    roles: ["MR"],
    keywords: ["create", "field", "call"],
  },
  {
    title: "Visit history",
    url: "/mr/history",
    group: "main",
    keywords: ["past", "visits", "log"],
  },
  {
    title: "Maps",
    url: "/mr/maps",
    group: "management",
    roles: ["MANAGER", "ADMIN"],
    keywords: ["map", "geo", "territory"],
  },
  {
    title: "Products",
    url: "/mr/products",
    group: "management",
    roles: ["MANAGER", "ADMIN"],
    keywords: ["sku", "catalog", "items"],
  },
  {
    title: "Reports",
    url: "/mr/reports",
    group: "reports",
    keywords: ["analytics", "summary", "hub"],
  },
  {
    title: "Lost sales",
    url: "/mr/reports/lost-sales",
    group: "reports",
    roles: ["MANAGER", "ADMIN"],
    keywords: ["lost", "sales", "missed"],
  },
  {
    title: "Top prescribers per chemist",
    url: "/mr/reports/top-prescribers-per-chemist",
    group: "reports",
    keywords: ["prescriber", "doctor", "chemist", "top"],
  },
  {
    title: "Substitution report",
    url: "/mr/reports/substitution",
    group: "reports",
    keywords: ["substitution", "alternatives"],
  },
  {
    title: "Out of stock report",
    url: "/mr/reports/out-of-stock",
    group: "reports",
    keywords: ["stock", "oos", "availability"],
  },
  {
    title: "Comparative pricing",
    url: "/mr/reports/comparative-pricing",
    group: "reports",
    keywords: ["price", "pricing", "compare"],
  },
  {
    title: "Regions audited",
    url: "/mr/reports/regions-audited",
    group: "reports",
    keywords: ["equitable", "region", "coverage", "audit"],
  },
  {
    title: "Pharmacies audited (detail)",
    url: "/mr/reports/pharmacies-audited-detail",
    group: "reports",
    keywords: ["pharmacy", "detail", "basket", "patients"],
  },
  {
    title: "OOS by pharmacy & product",
    url: "/mr/reports/oos-by-pharmacy-product",
    group: "reports",
    keywords: ["oos", "out of stock", "product", "audit"],
  },
  {
    title: "OOS ratio by product",
    url: "/mr/reports/oos-ratio-by-product",
    group: "reports",
    keywords: ["ratio", "oos", "product"],
  },
  {
    title: "Pharmacy market share",
    url: "/mr/reports/pharmacy-market-share",
    group: "reports",
    keywords: ["share", "rx", "prescription", "market"],
  },
  {
    title: "Top prescribers by product",
    url: "/mr/reports/top-prescribers-by-product",
    group: "reports",
    keywords: ["prescriber", "product", "doctor", "rx"],
  },
  {
    title: "Users",
    url: "/mr/users",
    group: "management",
    roles: ["ADMIN"],
    keywords: ["accounts", "team", "permissions"],
  },
];

const GROUP_LABEL: Record<MrNavSearchGroup, string> = {
  main: "Main menu",
  reports: "Reports",
  management: "Management",
};

export function getMrNavSearchItemsForRole(role: MrNavSearchRole): MrNavSearchItem[] {
  return ALL_ITEMS.filter((item) => {
    if (!item.roles) return true;
    return item.roles.includes(role);
  });
}

export function getGroupLabel(group: MrNavSearchGroup): string {
  return GROUP_LABEL[group];
}

export function filterMrNavSearchItems(
  items: MrNavSearchItem[],
  query: string
): MrNavSearchItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;

  return items.filter((item) => {
    const blob = [
      item.title,
      item.url.replace(/^\//, "").replace(/\//g, " "),
      ...(item.keywords ?? []),
    ]
      .join(" ")
      .toLowerCase();
    return blob.includes(q);
  });
}

