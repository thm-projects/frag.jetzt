import { FormControl } from '@angular/forms';
import { MultiLevelData } from '../multi-level-dialog/interface/multi-level-dialog.types';

export const MULTI_LEVEL_ROOM_CREATE: MultiLevelData = {
  title: '',
  buttonSection: '',
  confirmKey: '',
  questions: [
    {
      tag: 'room-name',
      title: '',
      action: {
        type: 'text-input',
        label: '',
        placeholder: '',
        hint: '',
        control: new FormControl('test'),
      },
    },
  ],
};
