import { ComponentRef, Injector, Type, ViewContainerRef } from '@angular/core';
import { Observable, of, ReplaySubject } from 'rxjs';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface ComponentBuilderSupport {
  destroyAll(): Observable<void>;

  createComponent<C>(componentType: Type<C>, data: undefined): void;

  createComponent<C extends { data: ComponentData<D> }, D>(
    componentType: Type<C>,
    data: D,
  ): void;
}

export interface ComponentLifeCycle {
  prepareDestroy: ReplaySubject<1>;
  destroyPrepared: ReplaySubject<1>;
  destroyer: ReplaySubject<1>;
}

export type ComponentData<E> = E & ComponentLifeCycle;

interface ComponentContext<E> {
  id: number;
  componentRef: ComponentRef<E>;
  lifeCycle: ComponentLifeCycle;
}

export function createComponentBuilder(config: {
  viewContainerRef: ViewContainerRef;
}): ComponentBuilderSupport {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const attachedComponents: ComponentContext<any>[] = [];
  let componentCounter: number = 0;
  return {
    createComponent<C, D>(componentType: Type<C>, data: D) {
      const componentId = componentCounter++;
      const lifeCycle: ComponentLifeCycle = createLifeCycle();
      const provider =
        typeof data !== 'undefined'
          ? {
              provide: MAT_DIALOG_DATA,
              useValue: {
                ...data,
                ...lifeCycle,
              } as ComponentData<D>,
            }
          : undefined;
      const componentRef = config.viewContainerRef.createComponent(
        componentType,
        {
          injector: Injector.create({
            providers: provider ? [provider] : undefined,
          }),
        },
      );
      attachedComponents.push({
        id: componentId,
        componentRef,
        lifeCycle,
      });

      function createLifeCycle() {
        const lifeCycle = {
          prepareDestroy: new ReplaySubject<1>(),
          destroyPrepared: new ReplaySubject<1>(),
          destroyer: new ReplaySubject<1>(),
        };
        lifeCycle.destroyPrepared.subscribe(() => {
          for (let i = 0; i < attachedComponents.length; i++) {
            const attachedComponent = attachedComponents[i];
            if (attachedComponent.id === componentId) {
              const item = attachedComponents.splice(i, 1)![0];
              item.componentRef.destroy();
            }
          }
        });
        return lifeCycle;
      }
    },
    destroyAll(): Observable<void> {
      const currentComponents = [...attachedComponents];
      if (currentComponents.length === 0) {
        return of(undefined);
      }
      // this doesn't work? forkJoin(currentComponents.map(x => x.lifeCycle.destroyPrepared.pipe(filter(value => !!value)))) as unknown as Observable<void>;
      return new Observable<void>((subscriber) => {
        let destroyedCount = 0;
        for (let i = 0; i < currentComponents.length; i++) {
          const currentComponent = currentComponents[i];
          currentComponent.componentRef.onDestroy(() => {
            if (++destroyedCount === currentComponents.length) {
              subscriber.next(undefined);
            }
          });
          currentComponent.lifeCycle.prepareDestroy.next(1);
        }
      });
    },
  };
}
