import { Component, OnInit } from '@angular/core';
import { LivepollTemplate, LivepollTemplateContext, templateContext } from '../../../../models/livepoll-template';
import { FormControl } from '@angular/forms';
import { DialogRef } from '@angular/cdk/dialog';
import { LivepollConfiguration } from '../../../../models/livepoll-configuration';
import { DeviceInfoService } from '../../../../services/util/device-info.service';

@Component({
  selector: 'app-livepoll-create',
  templateUrl: './livepoll-create.component.html',
  styleUrls: ['./livepoll-create.component.scss']
})
export class LivepollCreateComponent implements OnInit {

  public readonly templateContext = templateContext;
  public readonly translateKey = 'header';
  public titleSelection: string;
  public templateSelection = new FormControl<LivepollTemplateContext>(templateContext[0]);
  public selectedPreviewOption: number = -1;
  public isResultVisible: boolean = false;
  public isViewsVisible: boolean = false;

  constructor(
    public readonly dialogRef: DialogRef<LivepollConfiguration>,
    public readonly deviceService: DeviceInfoService
  ) {
  }

  create() {
    let templateKind: LivepollTemplate = LivepollTemplate.Symbol;
    if (this.templateSelection && this.templateSelection.value) {
      templateKind = this.templateSelection.value.kind;
    }
    this.dialogRef.close({
      template: templateKind,
      isLive: false,
      isResultVisible: this.isResultVisible,
      isViewsVisible: this.isViewsVisible,
      title: this.titleSelection
    });
  }

  ngOnInit(): void {
  }

  buildDeclineActionCallback(): () => void {
    return () => this.dialogRef.close();
  }

}
