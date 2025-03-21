import {
  AfterViewInit,
  Component,
  ComponentRef,
  Injector,
  OnDestroy,
  Renderer2,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import {
  defaultLivepollTemplate,
  LivepollGroupContext,
  LivepollTemplateContext,
  templateEntries,
  templateGroups,
} from '../../../../../models/livepoll-template';
import { FormControl } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, ReplaySubject } from 'rxjs';
import { SessionService } from 'app/services/util/session.service';
import { LivepollSession } from '../../../../../models/livepoll-session';
import { MatSelect } from '@angular/material/select';
import { LivepollComponentUtility } from '../livepoll-component-utility';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  LivepollDialogComponent,
  LivepollDialogInjectionData,
} from '../livepoll-dialog/livepoll-dialog.component';
import { LivepollSessionCreateAPI } from '../../../../../services/http/livepoll.service';
import { AppStateService } from 'app/services/state/app-state.service';

@Component({
  selector: 'app-livepoll-create',
  templateUrl: './livepoll-create.component.html',
  styleUrls: ['./livepoll-create.component.scss', '../livepoll-common.scss'],
  standalone: false,
})
export class LivepollCreateComponent implements OnDestroy, AfterViewInit {
  @ViewChild('viewContainerRef', { read: ViewContainerRef, static: true })
  vcr: ViewContainerRef;

  public readonly templateGroups: LivepollGroupContext[] = templateGroups;
  public readonly translateKey = 'common';

  public templateSelection = new FormControl<LivepollTemplateContext>(
    defaultLivepollTemplate,
  );

  public livepollConfiguration: LivepollSession;
  private _dialogInjection: BehaviorSubject<
    ComponentRef<LivepollDialogComponent>
  > = new BehaviorSubject(null);
  private _destroyer = new ReplaySubject(1);

  constructor(
    public readonly dialogRef: MatDialogRef<LivepollSessionCreateAPI>,
    public readonly translationService: TranslateService,
    public readonly http: HttpClient,
    private readonly sessionService: SessionService,
    private readonly renderer: Renderer2,
    appState: AppStateService,
  ) {
    LivepollComponentUtility.initLanguage(
      appState,
      this.translationService,
      this.http,
      this._destroyer,
    );
    this.livepollConfiguration = new LivepollSession({} as LivepollSession);
  }

  ngAfterViewInit(): void {
    this.templateSelection.statusChanges.subscribe(() => {
      this.livepollConfiguration.template = this.templateSelection.value.kind;
      if (this._dialogInjection.value) {
        this._dialogInjection.value.onDestroy(() =>
          this.injectDialogComponent(),
        );
        this._dialogInjection.value.destroy();
      } else {
        this.injectDialogComponent();
      }
    });
    this.injectDialogComponent();
  }

  public create() {
    const node = templateEntries[this.livepollConfiguration.template];
    const nodeAnswerCount = node.length ? node.length : node.symbols.length;
    if (!nodeAnswerCount) {
      throw new Error('Could not find answer count!');
    }
    const data = {
      roomId: this.sessionService.currentRoom.id,
      template: this.livepollConfiguration.template,
      title: this.livepollConfiguration.title,
      resultVisible: this.livepollConfiguration.resultVisible,
      viewsVisible: this.livepollConfiguration.viewsVisible,
      answerCount: nodeAnswerCount,
      customEntries: [],
    };
    this.dialogRef.close(data);
  }

  ngOnDestroy(): void {
    this._destroyer.next(0);
  }

  public overrideHeight($event: boolean, matSelect: MatSelect) {
    if (matSelect.panel?.nativeElement) {
      const height =
        window.innerHeight ||
        document.documentElement.clientHeight ||
        document.body.clientHeight;
      this.renderer.setStyle(
        matSelect.panel.nativeElement,
        'max-height',
        height -
          10 -
          matSelect.panel.nativeElement.getBoundingClientRect().y +
          'px',
      );
    }
  }

  private injectDialogComponent() {
    const component = this.vcr.createComponent(LivepollDialogComponent, {
      injector: Injector.create({
        providers: [
          {
            provide: MAT_DIALOG_DATA,
            useValue: {
              isProduction: false,
              session: this.livepollConfiguration,
            } as LivepollDialogInjectionData,
          },
        ],
      }),
    });
    this._dialogInjection.next(component);
  }
}
