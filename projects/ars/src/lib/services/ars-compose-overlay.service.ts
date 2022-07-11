import {ComponentRef, Injectable, OnInit, ViewContainerRef} from '@angular/core';
import {ArsComposeHostDirective} from "../compose/ars-compose-host.directive";
import {ArsComposeOverlayComponent} from "../compose/base/ars-compose-overlay/ars-compose-overlay.component";
import {ArsComposeService} from "./ars-compose.service";

@Injectable({
  providedIn: 'root'
})
export class ArsComposeOverlayService implements OnInit {
  constructor(
    public composeService: ArsComposeService
  ) {
  }

  ngOnInit() {
  }

  public open(viewContainerRef: ViewContainerRef): ComponentRef<ArsComposeOverlayComponent> {
    return viewContainerRef.createComponent(ArsComposeOverlayComponent);
  }
}
