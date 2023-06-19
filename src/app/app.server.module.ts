import { InjectionToken, NgModule, Renderer2, RendererFactory2, inject } from '@angular/core';
import { ServerModule } from '@angular/platform-server';

import { AppModule } from './app.module';
import { AppComponent } from './app.component';

export const DEFAULT_RENDERER = new InjectionToken<Renderer2>(
  'A Renderer2 for global services',
  {
      factory: () => inject(RendererFactory2).createRenderer(null, null),
  },
);

@NgModule({
  imports: [AppModule, ServerModule],
  bootstrap: [AppComponent],
  providers: [
    {
      provide: Renderer2,
      useFactory: () => inject(RendererFactory2).createRenderer(null, null),
      deps: [],
    },
  ]
})
export class AppServerModule {}
