import { Component, DestroyRef, inject, Injector } from '@angular/core';
import { applyDefaultNavigation } from 'app/navigation/default-navigation';

@Component({
  selector: 'app-admin-overview',
  templateUrl: './admin-overview.component.html',
  styleUrls: ['./admin-overview.component.scss'],
  standalone: false,
})
export class AdminOverviewComponent {
  private destroyRef = inject(DestroyRef);
  private injector = inject(Injector);

  constructor() {
    const sub = applyDefaultNavigation(this.injector).subscribe();
    this.destroyRef.onDestroy(() => sub.unsubscribe());
  }
}
