import {
  Resource,
  ResourceLoaderParams,
  ResourceRef,
  ResourceStatus,
  Signal,
  WritableResource,
  WritableSignal,
  computed,
  linkedSignal,
  runInInjectionContext,
  signal,
  untracked,
} from '@angular/core';
import { RxResourceOptions } from '@angular/core/rxjs-interop';
import { getInjector } from 'app/base/angular-init';
import { Subscription, switchMap, tap } from 'rxjs';
import { deepEqual } from './ts-utils';

type RxComputedResourceOptions<T, D> = Omit<
  RxResourceOptions<T, D>,
  'injector'
>;

const DUMMY = {} as const;

export class ComputedResource<T> implements Resource<T> {
  protected readonly updateCounter = signal(0);
  protected readonly loading = signal<-1 | 0 | 1>(0);
  protected readonly lastValue = signal<T | undefined>(undefined);
  private readonly lastAbortController = signal<AbortController>(null);
  private readonly lastSubscription = signal<Subscription>(null);
  private lastRequest: [number, unknown] = [0, undefined];
  protected readonly errorSignal = signal<unknown>(undefined);
  protected readonly valueSignal: WritableSignal<T>;
  readonly value: Signal<T>;
  readonly status = computed(() => this.getPreviousStatus(DUMMY));
  readonly error = computed(() =>
    this.status() !== ResourceStatus.Error ? undefined : this.errorSignal(),
  );
  readonly isLoading = computed(() => this.loading() !== 0);

  constructor(
    opts: RxComputedResourceOptions<T, unknown> | WritableComputedResource<T>,
  ) {
    if (opts instanceof WritableComputedResource) {
      this.valueSignal = opts.valueSignal;
      this.value = opts.value.asReadonly();
      this.status = opts.status;
      this.loading = opts.loading;
      this.lastValue = opts.lastValue;
      this.updateCounter = opts.updateCounter;
      this.errorSignal = opts.errorSignal;
      this.lastAbortController = opts.lastAbortController;
      this.lastSubscription = opts.lastSubscription;
      return;
    }
    this.valueSignal = linkedSignal({
      equal: opts?.equal,
      source: () => {
        const counter = this.updateCounter();
        const req = opts.request?.();
        if (this.lastRequest[0] !== counter || this.lastRequest[1] !== req) {
          this.lastRequest = [counter, req];
        }
        return this.lastRequest;
      },
      computation: (current, previous) => {
        if (current[1] === undefined) return undefined;
        if (deepEqual(current, previous?.source)) return previous?.value;
        const prev = this.getPreviousStatus(previous?.value);
        const reloading = current[0] > previous?.source?.[0];
        untracked(() => this.loading.set(reloading ? -1 : 1));
        setTimeout(() =>
          this.makeRequest(opts.loader, {
            abortSignal: null,
            previous: {
              status: prev,
            },
            request: current[1],
          }),
        );
        return reloading ? previous?.value : undefined;
      },
    });
    this.value = this.valueSignal.asReadonly();
  }

  hasValue(): this is Resource<T> & { value: Signal<T> } {
    return Boolean(this.value());
  }

  reload(): boolean {
    this.updateCounter.update((v) => v + 1);
    return true;
  }

  protected cancel(reason: unknown) {
    this.lastAbortController.update((v) => {
      v?.abort(reason);
      return null;
    });
    this.lastSubscription.update((v) => {
      v?.unsubscribe();
      return null;
    });
  }

  private makeRequest(
    loader: RxResourceOptions<T, unknown>['loader'],
    params: ResourceLoaderParams<unknown>,
  ) {
    this.cancel('New Request');
    this.errorSignal.set(undefined);
    this.lastSubscription.set(
      getInjector()
        .pipe(
          switchMap((injector) => {
            const controller = new AbortController();
            this.lastAbortController.set(controller);
            return runInInjectionContext(injector, () =>
              loader({
                ...params,
                abortSignal: controller.signal,
              }),
            );
          }),
          tap({
            next: (v) => {
              this.errorSignal.set(undefined);
              this.lastValue.set(v);
              this.loading.set(0);
              this.valueSignal.set(v);
            },
            error: (e) => {
              this.errorSignal.set(e);
              this.lastValue.set(undefined);
              this.loading.set(0);
              this.valueSignal.set(undefined);
            },
          }),
        )
        .subscribe(),
    );
  }

  private getPreviousStatus(v: T | typeof DUMMY) {
    const loading = this.loading();
    if (loading !== 0) {
      return loading === -1 ? ResourceStatus.Reloading : ResourceStatus.Loading;
    }
    v = v === DUMMY ? this.valueSignal() : v;
    const lastValue = this.lastValue();
    if (v !== lastValue) {
      return ResourceStatus.Local;
    }
    const e = this.errorSignal();
    if (e !== undefined) {
      return ResourceStatus.Error;
    }
    return v ? ResourceStatus.Resolved : ResourceStatus.Idle;
  }
}

export class WritableComputedResource<T>
  extends ComputedResource<T>
  implements ResourceRef<T> {
  override readonly value = this.valueSignal;

  constructor(opts: RxComputedResourceOptions<T, unknown>) {
    super(opts);
    this.value = this.valueSignal;
  }

  override hasValue(): this is WritableResource<T> & {
    value: WritableSignal<T>;
  } {
    return Boolean(this.value());
  }

  set(value: T): void {
    this.value.set(value);
  }

  update(updater: (value: T) => T): void {
    this.value.update(updater);
  }

  asReadonly(): Resource<T> {
    return new ComputedResource<T>(this);
  }

  destroy(): void {
    this.cancel('Destroy');
    this.loading.set(0);
    this.updateCounter.set(0);
    this.lastValue.set(undefined);
    this.valueSignal.set(undefined);
    this.errorSignal.set(undefined);
  }
}

export const computedResource = <T, D>(
  opts: RxComputedResourceOptions<T, D>,
): WritableComputedResource<T> => new WritableComputedResource<T>(opts);
