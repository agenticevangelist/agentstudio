"use client";

import { Suspense } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

function useQueryParamsInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function updateQueryParams(keys: string | string[], values: string | string[]) {
    const sp = new URLSearchParams(searchParams?.toString() || "");
    if (Array.isArray(keys)) {
      keys.forEach((k, i) => sp.set(k, Array.isArray(values) ? values[i] : ""));
    } else {
      sp.set(keys, Array.isArray(values) ? values[0] : values);
    }
    router.push(`${pathname}?${sp.toString()}`);
  }

  function getSearchParam(key: string): string | null {
    return searchParams?.get(key) ?? null;
  }

  return { searchParams, updateQueryParams, getSearchParam };
}

export function useQueryParams() {
  // This hook is meant to be used inside Suspense-ready components.
  // For pages/components that might render during prerender, ensure they are wrapped in <Suspense>.
  return useQueryParamsInner();
}
