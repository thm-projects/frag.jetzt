import { Component, Input, OnInit } from '@angular/core';
import {
  defaultCustomTemplate,
  LivepollCustomTemplateConfiguration,
  LivepollCustomTemplateOption,
  LivepollTemplate,
  LivepollTemplateContext,
  templateEntries,
  templateGroups,
} from '../../../../../models/livepoll-template';
import { LivepollSession } from '../../../../../models/livepoll-session';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-livepoll-template-builder',
  templateUrl: './livepoll-template-builder.component.html',
  styleUrls: ['./livepoll-template-builder.component.scss'],
})
export class LivepollTemplateBuilderComponent implements OnInit {
  protected static readonly localStorageKey: string = 'livepoll-custom-cache';

  @Input() public livepollSession!: LivepollSession;
  @Input() public templateSelection!: FormControl<LivepollTemplateContext>;
  public predefinedSelection: FormControl<LivepollTemplateContext>;
  public readonly templateGroups = templateGroups;
  public readonly translateKey: string = 'common';
  public customTemplate: LivepollCustomTemplateConfiguration | undefined;
  public selectedIndex: number = 0;

  constructor() {
    if (
      !!localStorage.getItem(LivepollTemplateBuilderComponent.localStorageKey)
    ) {
      // serializer check, in case template changes or values are missing?
      this.customTemplate = {
        ...defaultCustomTemplate,
        ...JSON.parse(
          localStorage.getItem(
            LivepollTemplateBuilderComponent.localStorageKey,
          ),
        ),
      };
    } else {
      this.customTemplate = defaultCustomTemplate;
    }
  }

  ngOnInit(): void {
    console.log(this.selectedIndex);
    if (this.templateSelection.value?.kind === LivepollTemplate.Custom) {
      this.selectedIndex = 1;
      this.predefinedSelection = new FormControl<LivepollTemplateContext>(
        templateEntries[0],
      );
    } else {
      this.predefinedSelection = new FormControl<LivepollTemplateContext>(
        this.templateSelection.value,
      );
    }
  }

  onSelectedIndexChange() {
    console.log(this.selectedIndex);
    if (this.selectedIndex) {
      this.templateSelection.setValue(this.customTemplate);
    } else {
      this.templateSelection.setValue(this.predefinedSelection.value);
    }
  }

  addOption() {
    this.customTemplate.options.push({
      text: 'option #' + this.customTemplate.options.length,
    });
    this.saveChanges();
  }

  removeOption(
    index: number,
    save: boolean = true,
  ): LivepollCustomTemplateOption {
    const target = this.customTemplate[index];
    this.customTemplate.options = [
      ...this.customTemplate.options.slice(0, index),
      ...this.customTemplate.options.slice(index + 1),
    ];
    if (save) {
      this.saveChanges();
    }
    return target;
  }

  saveChanges() {
    localStorage.setItem(
      LivepollTemplateBuilderComponent.localStorageKey,
      JSON.stringify(this.customTemplate),
    );
    this.templateSelection.setValue(this.customTemplate);
  }

  moveOption(index: number, position: number) {
    if (position < 0) {
      position = 0;
    }
    if (position > this.customTemplate.options.length) {
      position = this.customTemplate.options.length;
    }
    // TODO
  }
}
