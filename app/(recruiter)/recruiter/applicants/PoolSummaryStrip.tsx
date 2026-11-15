import type { PoolSummary } from "@/lib/domain/insights";

export function PoolSummaryStrip({ summary }: { summary: PoolSummary }) {
  if (summary.coreCount === 0) {
    return <p className="panel mt-6">Set your core requirements to see who covers them.</p>;
  }
  const { signalled, coverAll, coreCount, openSlots } = summary;
  return (
    <p className="panel mt-6">
      <strong>{signalled}</strong> {signalled === 1 ? "person chose" : "people chose"} you on purpose ·{" "}
      <strong>{coverAll}</strong> {coverAll === 1 ? "has" : "have"} an example for all {coreCount} core requirements ·{" "}
      <strong>{openSlots}</strong> meeting {openSlots === 1 ? "slot" : "slots"} open
    </p>
  );
}
