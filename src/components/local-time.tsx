"use client";

import { useSyncExternalStore } from "react";

const noop = () => () => {};

export function LocalTime({ iso }: { iso: string }) {
  const text = useSyncExternalStore(
    noop,
    () =>
      new Date(iso).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }),
    () => `${iso.slice(0, 16).replace("T", " ")} UTC`
  );

  return <time dateTime={iso}>{text}</time>;
}