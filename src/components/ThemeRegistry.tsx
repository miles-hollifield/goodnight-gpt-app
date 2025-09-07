"use client";

import * as React from "react";
import { CacheProvider } from "@emotion/react";
import createCache from "@emotion/cache";
import { useServerInsertedHTML } from "next/navigation";

/**
 * Emotion SSR integration for Next.js App Router.
 * Ensures server and client insert styles in the same order to avoid hydration errors.
 */
export function ThemeRegistry({ children }: { children: React.ReactNode }) {
  const [{ cache, flush }] = React.useState(() => {
    const cache = createCache({ key: "mui", prepend: true });
    cache.compat = true;

    const inserted: string[] = [];
    const prevInsert = cache.insert;
    // Track which style names were inserted during the current render
    cache.insert = (...args: [selector: string, serialized: { name: string }]) => {
      const [, serialized] = args;
      if (!cache.inserted[serialized.name]) {
        inserted.push(serialized.name);
      }
      // @ts-expect-error emotion types mismatch between versions; call original insert
      return prevInsert(...args);
    };

    const flush = () => {
      const prev = inserted.slice();
      inserted.length = 0;
      return prev;
    };

    return { cache, flush };
  });

  useServerInsertedHTML(() => {
    const names = flush();
    if (names.length === 0) return null;
    return (
      <style
        data-emotion={`${cache.key} ${names.join(" ")}`}
        dangerouslySetInnerHTML={{
          __html: names.map((name) => (cache.inserted as Record<string, string>)[name]).join(""),
        }}
      />
    );
  });

  return <CacheProvider value={cache}>{children}</CacheProvider>;
}
