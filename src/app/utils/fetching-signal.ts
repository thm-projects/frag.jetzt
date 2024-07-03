import { Signal, computed, signal, untracked } from '@angular/core';
import { Observable, Subscription } from 'rxjs';

interface FetchingSignalInit<Input, Output> {
  initialState?: Output;
  fetchingState?: (input: Input) => Output;
  fetch: (data: Input) => Observable<Output>;
  provider: Signal<Input>;
}

export const fetchingSignal = <In, Out>({
  initialState,
  fetchingState,
  fetch,
  provider,
}: FetchingSignalInit<In, Out>) => {
  const fetchedData = signal<{ input: In; output: Out }>(
    initialState !== undefined
      ? {
          input: provider(),
          output: initialState,
        }
      : null,
  );
  let lastSubscription: Subscription | null = null;
  return computed(() => {
    const value = provider();
    const fetched = fetchedData();
    if (fetched && value === fetched.input) {
      return fetched.output;
    }
    lastSubscription?.unsubscribe();
    untracked(() =>
      fetchedData.set({ input: value, output: fetchingState?.(value) }),
    );
    lastSubscription = fetch(value).subscribe((output) =>
      untracked(() => fetchedData.set({ input: value, output })),
    );
    return fetchedData().output;
  });
};
