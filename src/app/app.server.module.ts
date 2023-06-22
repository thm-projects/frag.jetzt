import {
  InjectionToken,
  NgModule,
  NgZone,
  Renderer2,
  RendererFactory2,
  inject,
} from '@angular/core';
import { ServerModule } from '@angular/platform-server';

import { AppModule } from './app.module';
import { AppComponent } from './app.component';

import 'zone.js/plugins/task-tracking';

export const DEFAULT_RENDERER = new InjectionToken<Renderer2>(
  'A Renderer2 for global services',
  {
    factory: () => inject(RendererFactory2).createRenderer(null, null),
  },
);

@NgModule({
  imports: [AppModule, ServerModule],
  bootstrap: [AppComponent],
})
export class AppServerModule {
  constructor(private ngZone: NgZone) {
    // when something is stuck on SSR use this:
    // this.printPendingTasks();
  }

  private printPendingTasks(waitSeconds = 2) {
    console.log(
      `⏳ ... Wait ${waitSeconds} seconds to dump pending tasks ... ⏳`,
    );

    // Run the debugging `setTimeout` code outside of
    // the Angular Zone, so it's not considered as
    // yet another pending Zone Task:
    this.ngZone.runOutsideAngular(() => {
      setTimeout(() => {
        // Access the NgZone's internals - TaskTrackingZone:
        const TaskTrackingZone =
          this.ngZone['_inner']._parent._properties.TaskTrackingZone;

        // Print to the console all pending tasks
        // (micro tasks, macro tasks and event listeners):
        console.debug('👀 Pending tasks in NgZone: 👀');
        console.debug({
          microTasks: TaskTrackingZone.getTasksFor('microTask'),
          macroTasks: TaskTrackingZone.getTasksFor('macroTask'),
          eventTasks: TaskTrackingZone.getTasksFor('eventTask'),
        });

        // Advice how to find the origin of Zone tasks:
        console.debug(
          `👀 For every pending Zone Task listed above investigate the stacktrace in the property 'creationLocation' 👆`,
        );
      }, 1000 * waitSeconds);
    });
  }
}
