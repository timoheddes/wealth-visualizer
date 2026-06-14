import { useState } from "react";
import { LoadingButton } from "@/components/LoadingButton";
import { Button } from "@/components/ui/button";
import { useDeferredAction } from "@/lib/use-deferred-action";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <h3 className="text-foreground text-sm font-medium">{title}</h3>
      <div className="text-muted-foreground space-y-2 text-sm">{children}</div>
    </section>
  );
}

export function HowItWorksSheet({
  onApplyExample,
}: {
  onApplyExample: () => void;
}) {
  const [open, setOpen] = useState(false);
  const { isPending, run } = useDeferredAction();

  function handleApplyExample() {
    run(() => {
      onApplyExample();
      setOpen(false);
    });
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="link"
          className="h-auto cursor-pointer p-0 text-sm"
        >
          How it works
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>How it works</SheetTitle>
          <SheetDescription>
            Model your wealth over time with sources, mutations, and an
            interactive chart.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 px-4 pb-6">
          <Section title="The basics">
            <p>
              A <strong className="text-foreground">source</strong> is an asset
              or account that grows over time. A{" "}
              <strong className="text-foreground">mutation</strong> is a cash
              flow — money added, removed, or transferred. The chart projects
              each source forward and sums them into a dashed{" "}
              <strong className="text-foreground">Total</strong> line.
            </p>
          </Section>

          <Section title="1. Add sources">
            <p>
              Use the sidebar to add one or more sources. Each source needs:
            </p>
            <ul className="list-disc space-y-1 pl-4">
              <li>
                <strong className="text-foreground">Type</strong> — Investment,
                Cash, Property, Pension, Depreciating asset, or Debt
              </li>
              <li>
                <strong className="text-foreground">Initial value</strong> (or
                balance owed for debt) and{" "}
                <strong className="text-foreground">start date</strong>
              </li>
              <li>
                <strong className="text-foreground">Annual growth %</strong>{" "}
                (e.g. 12% for investments, 0% for cash, −12% for a car, 4%
                interest on debt)
              </li>
              <li>
                <strong className="text-foreground">End date</strong> — when the
                source stops (e.g. sale date, loan payoff, retirement)
              </li>
            </ul>
            <p>
              <strong className="text-foreground">Debt</strong> sources show the
              amount owed on their own line; the{" "}
              <strong className="text-foreground">Total</strong> line subtracts
              them to reflect net worth. Pay down debt with negative mutations on
              the debt source.
            </p>
          </Section>

          <Section title="2. Add mutations">
            <p>Mutations model money moving in or out. Choose:</p>
            <ul className="list-disc space-y-1 pl-4">
              <li>
                <strong className="text-foreground">One-off</strong> — a single
                event on a specific date (e.g. selling a home)
              </li>
              <li>
                <strong className="text-foreground">Recurring</strong> — repeats
                every N days (e.g. monthly salary every 30 days)
              </li>
              <li>
                <strong className="text-foreground">Applies to</strong> — a
                specific source, or{" "}
                <strong className="text-foreground">Total</strong> for portfolio-wide
                costs split across sources
              </li>
            </ul>
            <p>
              Use a positive value for inflows and negative for outflows.
              Recurring deposits compound at the source&apos;s growth rate.
            </p>
          </Section>

          <Section title="Example setup">
            <p>
              A realistic plan might include three sources and several mutations:
            </p>
            <ul className="list-disc space-y-1 pl-4">
              <li>
                <strong className="text-foreground">Index fund</strong> — €25,000
                investment at 7% growth
              </li>
              <li>
                <strong className="text-foreground">Income</strong> — €0 cash
                account at 0% growth, receiving salary and paying expenses
              </li>
              <li>
                <strong className="text-foreground">Home</strong> — €300,000
                property at 3% growth, ending when sold
              </li>
            </ul>
            <p>Then add mutations to connect them:</p>
            <ul className="list-disc space-y-1 pl-4">
              <li>
                Recurring <strong className="text-foreground">+€3,000 salary</strong>{" "}
                and <strong className="text-foreground">−€1,500 living expenses</strong>{" "}
                on Income
              </li>
              <li>
                Recurring <strong className="text-foreground">−€500</strong> from
                Income and <strong className="text-foreground">+€500</strong> to
                Index fund — a monthly savings transfer pair
              </li>
              <li>
                One-off <strong className="text-foreground">sell home</strong>{" "}
                (removes the property at its sale value),{" "}
                <strong className="text-foreground">sale proceeds</strong> (the
                full sale price to Index fund), and{" "}
                <strong className="text-foreground">mortgage payoff</strong>{" "}
                (−€180,000 on Total) — all on the same date. Net worth drops by
                the mortgage amount, then keeps growing from salary and savings.
              </li>
            </ul>
            <p>
              Tip: set the property&apos;s end date to the sale date so it stops
              growing after you sell. Use{" "}
              <strong className="text-foreground">Link mutations</strong> in chart
              visibility to toggle related events together.
            </p>
            <div className="space-y-2 rounded-md border border-amber-500/30 bg-amber-500/5 p-3">
              <p className="text-xs text-amber-800 dark:text-amber-300">
                Applying the example will replace all existing sources, mutations,
                and chart settings.
              </p>
              <LoadingButton
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                isLoading={isPending}
                loadingLabel="Applying example..."
                onClick={handleApplyExample}
              >
                Apply example data
              </LoadingButton>
            </div>
          </Section>

          <Section title="3. Read the chart">
            <ul className="list-disc space-y-1 pl-4">
              <li>
                Each source appears as a colored line;{" "}
                <strong className="text-foreground">Total</strong> is the dashed
                net-worth sum (assets minus debt)
              </li>
              <li>
                Colored dots mark one-off mutation dates — hover for details
              </li>
              <li>
                Drag the <strong className="text-foreground">time range</strong>{" "}
                slider to zoom in on a period
              </li>
              <li>
                The chart timeline extends to the latest end date on any source or
                mutation
              </li>
            </ul>
          </Section>

          <Section title="4. Explore scenarios">
            <p>
              Under <strong className="text-foreground">Chart visibility</strong>,
              toggle sources and mutations on or off without deleting them. This
              lets you ask &ldquo;what if I didn&apos;t sell the home?&rdquo;
              or hide a recurring expense to compare outcomes.
            </p>
            <p>
              Use <strong className="text-foreground">Link mutations</strong> to
              group related events — e.g. link the sell, sale proceeds, and
              mortgage mutations so one toggle controls the whole transaction.
              Recurring transfer pairs (outflow + inflow) work the same way.
            </p>
          </Section>

          <Section title="Other features">
            <ul className="list-disc space-y-1 pl-4">
              <li>
                <strong className="text-foreground">Edit</strong> any source or
                mutation from the sidebar list
              </li>
              <li>
                <strong className="text-foreground">Export / Import</strong> saves
                your full setup as JSON, including visibility and link groups
              </li>
              <li>
                Switch <strong className="text-foreground">currency</strong> and{" "}
                <strong className="text-foreground">theme</strong> from the header
              </li>
              <li>
                Data is stored in your browser automatically between sessions
              </li>
            </ul>
          </Section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
