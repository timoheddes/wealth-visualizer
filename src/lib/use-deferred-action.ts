import { useTransition } from "react";

export function useDeferredAction() {
  const [isPending, startTransition] = useTransition();

  function run(action: () => void) {
    if (isPending) return;
    startTransition(action);
  }

  return { isPending, run };
}
