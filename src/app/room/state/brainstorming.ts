import { effect, signal } from '@angular/core';
import { getInjector } from 'app/base/angular-init';
import { BrainstormingCategory } from 'app/models/brainstorming-category';
import { room } from './room';

const categoriesSignal = signal<BrainstormingCategory[]>(null);
export const categories = categoriesSignal.asReadonly();
export const updateCategories = (categories: BrainstormingCategory[]) => {
  categoriesSignal.set(categories);
};

getInjector().subscribe((injector) => {
  effect(
    () => {
      const r = room();
      if (!r) {
        categoriesSignal.set(null);
      }
      //TODO: Fetch
    },
    { injector, allowSignalWrites: true },
  );
});
