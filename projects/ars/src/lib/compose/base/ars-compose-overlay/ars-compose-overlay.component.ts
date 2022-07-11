import {Component, ViewChild} from '@angular/core';
import {ArsComposeHostDirective} from "../../ars-compose-host.directive";
import {ArsLifeCycleVisitor} from "../../../models/util/ars-life-cycle-visitor";

@Component({
  selector: 'ars-compose-overlay',
  templateUrl: './ars-compose-overlay.component.html',
  styleUrls: ['./ars-compose-overlay.component.scss']
})
export class ArsComposeOverlayComponent extends ArsLifeCycleVisitor {

  @ViewChild(ArsComposeHostDirective) public readonly host: ArsComposeHostDirective;

  constructor() {
    super();
  }

}
