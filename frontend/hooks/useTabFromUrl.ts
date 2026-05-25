"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function useTabFromUrl<T extends string>(param: string, defaultTab: T, valid: readonly T[]) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromUrl = searchParams.get(param);
  const initial = (fromUrl && valid.includes(fromUrl as T) ? fromUrl : defaultTab) as T;
  const [tab, setTabState] = useState<T>(initial);

  useEffect(() => {
    const q = searchParams.get(param);
    if (q && valid.includes(q as T)) {
      setTabState(q as T);
    }
  }, [searchParams, param, valid]);

  const setTab = useCallback(
    (next: T) => {
      setTabState(next);
      const params = new URLSearchParams(searchParams.toString());
      params.set(param, next);
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams, param]
  );

  return [tab, setTab] as const;
}
