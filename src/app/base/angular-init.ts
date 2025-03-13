import { Injector } from '@angular/core';
import { ReplaySubject, take } from 'rxjs';

export const angularInjector = new ReplaySubject<Injector>(1);

export const getInjector = () => angularInjector.pipe(take(1));
