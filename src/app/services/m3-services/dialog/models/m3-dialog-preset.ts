import { M3DialogButton, M3DialogElementKind } from './m3-dialog-types';

export const CANCEL_BUTTON: M3DialogButton = {
  kind: M3DialogElementKind.Button,
  action: (ref) => ref.close(false),
  text: 'cancel',
  align: 'end',
};

export const ACCEPT_BUTTON: M3DialogButton = {
  kind: M3DialogElementKind.Button,
  action: (ref) => ref.close(true),
  text: 'accept',
  align: 'end',
};
