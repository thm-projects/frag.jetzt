import { Component, inject, Input } from '@angular/core';
import {
  M3ButtonAction,
  M3ButtonTemplate,
  M3LabelTemplate,
  M3State,
} from '../m3-navigation-types';
import { M3Icon, M3Label } from '../../buttons/base';
import { M3LabelButton } from '../../buttons/label-button';
import { MatIcon } from '@angular/material/icon';
import {
  MatMenu,
  MatMenuContent,
  MatMenuItem,
  MatMenuTrigger,
} from '@angular/material/menu';
import { NgComponentOutlet, NgForOf, NgIf } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatButton, MatIconButton } from '@angular/material/button';

abstract class M3TemplateList {
  router = inject(Router);

  applyButtonAction(label: M3ButtonAction) {
    if (label.click) {
      label.click();
    } else if (label.route) {
      this.router.navigate(label.route.commands, label.route.extras);
    } else {
      console.error(`missing action / route for button`, label);
    }
  }
}

@Component({
  selector: '[m3LabelTemplateList]',
  template: ` @for (label of labels; track label.text) {
    @if (label.triggerFor) {
      <button
        m3-label-button
        [activated]="label.state === M3State.Active"
        [matMenuTriggerFor]="labelMenu"
        [disabled]="label.state === M3State.Disabled"
      >
        <span m3-icon>{{ label.icon }}</span>
        <span m3-label>{{ label.text }}</span>
      </button>
      <mat-menu #labelMenu>
        <button mat-menu-item *ngFor="let item of label.triggerFor">
          <mat-icon *ngIf="item.icon">{{ item.icon }}</mat-icon>
          {{ item.text }}
        </button>
      </mat-menu>
    } @else {
      <button
        m3-label-button
        (click)="applyButtonAction(label)"
        [activated]="label.state === M3State.Active"
        [disabled]="label.state === M3State.Disabled"
      >
        <span m3-icon>{{ label.icon }}</span>
        <span m3-label>{{ label.text }}</span>
      </button>
    }
  }`,
  imports: [
    M3Icon,
    M3Label,
    M3LabelButton,
    MatIcon,
    MatMenu,
    MatMenuItem,
    NgForOf,
    NgIf,
    MatMenuTrigger,
    RouterLink,
    NgComponentOutlet,
    MatMenuContent,
  ],
  standalone: true,
})
export class M3LabelTemplateList extends M3TemplateList {
  protected readonly M3State = M3State;
  protected labels: M3LabelTemplate[] = [];

  @Input({ alias: 'm3LabelTemplateList' })
  set _labels(labels: M3LabelTemplate[]) {
    this.labels = labels;
  }
}

@Component({
  selector: '[m3ButtonTemplateList]',
  template: `
    @for (label of labels; track label) {
      @if (label.triggerFor) {
        <mat-menu #labelMenu>
          <button mat-menu-item *ngFor="let item of label.triggerFor">
            <mat-icon *ngIf="item.icon">{{ item.icon }}</mat-icon>
            {{ item.text }}
          </button>
        </mat-menu>
        @switch (label.type) {
          @case ('icon') {
            <button
              mat-icon-button
              [matMenuTriggerFor]="labelMenu"
              [disabled]="label.state === M3State.Disabled"
              class="{{ label.color || '' }}"
            >
              <mat-icon *ngIf="label.icon">{{ label.icon }}</mat-icon>
              {{ label.text }}
            </button>
          }
          @default {
            <button
              mat-button
              [matMenuTriggerFor]="labelMenu"
              [disabled]="label.state === M3State.Disabled"
              class="{{ label.color || '' }}"
            >
              <mat-icon *ngIf="label.icon">{{ label.icon }}</mat-icon>
              {{ label.text }}
            </button>
          }
        }
      } @else {
        @switch (label.type) {
          @case ('icon') {
            <button
              mat-icon-button
              (click)="applyButtonAction(label)"
              [disabled]="label.state === M3State.Disabled"
              class="{{ label.color || '' }}"
            >
              <mat-icon>{{ label.icon }}</mat-icon>
            </button>
          }
          @default {
            <button
              mat-button
              (click)="applyButtonAction(label)"
              [disabled]="label.state === M3State.Disabled"
              class="{{ label.color || '' }}"
            >
              <mat-icon *ngIf="label.icon">{{ label.icon }}</mat-icon>
              {{ label.text }}
            </button>
          }
        }
      }
    }
  `,
  imports: [
    MatButton,
    NgIf,
    MatIcon,
    MatIconButton,
    MatMenu,
    MatMenuItem,
    MatMenuTrigger,
    NgComponentOutlet,
    NgForOf,
  ],
  standalone: true,
})
export class M3ButtonTemplateList extends M3TemplateList {
  protected labels: M3ButtonTemplate[] = [];

  @Input({ alias: 'm3ButtonTemplateList' })
  set _labels(labels: M3ButtonTemplate[]) {
    this.labels = labels;
  }

  protected readonly M3State = M3State;
}
