import { argbFromHex, CustomColor } from '@material/material-color-utilities';

const YELLOW: CustomColor = {
  name: 'yellow',
  value: argbFromHex('#FFF300'),
  blend: true,
};

const GREEN: CustomColor = {
  name: 'green',
  value: argbFromHex('#00FF74'),
  blend: true,
};

const RED: CustomColor = {
  name: 'red',
  value: argbFromHex('#FF008B'),
  blend: true,
};

export const CUSTOM_COLORS: CustomColor[] = [YELLOW, GREEN, RED];
