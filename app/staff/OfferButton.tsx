"use client";

import { useState } from "react";

export function OfferButton({ pseudonym }: { pseudonym: string }) {
  const [offered, setOffered] = useState(false);

  if (offered) {
    return (
      <span className="tag tag-success min-h-11 px-4">
        Offered
      </span>
    );
  }
  return (
    <button
      type="button"
      onClick={() => setOffered(true)}
      aria-label={`Offer coaching session to ${pseudonym}`}
      className="btn btn-primary"
    >
      Offer coaching session
    </button>
  );
}
