import { MatDialogRef } from '@angular/material/dialog';

export enum M3DialogElementKind {
  Basic,
  FullScreen,
  Description,
  Button,
  Title,
  IconTitle,
}

export interface AbstractM3DialogElement<E extends M3DialogElementKind> {
  kind: E;
}

export interface M3DialogDescription
  extends AbstractM3DialogElement<M3DialogElementKind.Description> {
  text: string;
}

export interface M3DialogButton
  extends AbstractM3DialogElement<M3DialogElementKind.Button> {
  text: string;
  icon?: string;
  align: 'start' | 'center' | 'end';
  action: <E>(matDialogRef: MatDialogRef<E>) => void;
}

interface M3DialogTitle
  extends AbstractM3DialogElement<M3DialogElementKind.Title> {
  text: string;
}

interface M3DialogIconTitle
  extends AbstractM3DialogElement<M3DialogElementKind.IconTitle> {
  icon: string;
  text: string;
}

export type M3DialogContent = M3DialogDescription;

export type M3DialogAction = M3DialogButton;

export type M3DialogHeadline = M3DialogTitle | M3DialogIconTitle;

export type M3DialogKind =
  | M3DialogElementKind.Basic
  | M3DialogElementKind.FullScreen;

export interface AbstractM3DialogData<E extends M3DialogKind> {
  kind: E;
  headline: M3DialogHeadline;
  content: M3DialogContent[];
  actions: M3DialogAction[];
  translation?: string;
}

export interface M3BasicDialogData
  extends AbstractM3DialogData<M3DialogElementKind.Basic> {}

export type M3DialogData = M3BasicDialogData;
