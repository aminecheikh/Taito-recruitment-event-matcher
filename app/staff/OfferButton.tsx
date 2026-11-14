"use client";

import { useState } from "react";

export function OfferButton({ pseudonym }: { pseudonym: string }) {
  const [offered, setOffered] = useState(false);

  if (offered) {
    return (
      <span className="inline-flex min-h-11 items-center text-sm font-medium text-neutral-900">
        Offered
      </span>
    );
  }
  return (
    <button
      type="button"
      onClick={() => setOffered(true)}
      aria-label={`Offer coaching session to ${pseudonym}`}
      className="min-h-11 rounded border border-neutral-900 bg-neutral-900 px-3 text-sm font-medium text-white"
    >
      Offer coaching session
    </button>
  );
}
