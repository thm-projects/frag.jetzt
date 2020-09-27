import { TSMap } from 'typescript-map';

// A map of available keyboard keys for the application
export const KEYBOARD_KEYS: TSMap<KeyboardKey, IKeyboardKey> = new TSMap;


/**
 * A basic keyboard key definition.
 */
export interface IKeyboardKey {

  /**
   * @see https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key
   */
  key: string[];


  /**
   * @see https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/which
   */
  keyCode: number;
}


/**
 * Contains some application relevant key bindings to allow easy and semantic usage of keyboard util class.
 */
export enum KeyboardKey {
  Digit0,
  Digit1,
  Digit2,
  Digit3,
  Digit4,
  Digit5,
  Digit6,
  Digit7,
  Digit8,
  Digit9,
  Escape,
  Backspace
}

// Setup all application available keyboard keys here
// @see https://keycode.info/ for easy keyboard key detection
KEYBOARD_KEYS.set(KeyboardKey.Digit0,    { key: ['0'], keyCode: 48 });
KEYBOARD_KEYS.set(KeyboardKey.Digit1,    { key: ['1'], keyCode: 49 });
KEYBOARD_KEYS.set(KeyboardKey.Digit2,    { key: ['2'], keyCode: 50 });
KEYBOARD_KEYS.set(KeyboardKey.Digit3,    { key: ['3'], keyCode: 51 });
KEYBOARD_KEYS.set(KeyboardKey.Digit4,    { key: ['4'], keyCode: 52 });
KEYBOARD_KEYS.set(KeyboardKey.Digit5,    { key: ['5'], keyCode: 53 });
KEYBOARD_KEYS.set(KeyboardKey.Digit6,    { key: ['6'], keyCode: 54 });
KEYBOARD_KEYS.set(KeyboardKey.Digit7,    { key: ['7'], keyCode: 55 });
KEYBOARD_KEYS.set(KeyboardKey.Digit8,    { key: ['8'], keyCode: 56 });
KEYBOARD_KEYS.set(KeyboardKey.Digit9,    { key: ['9'], keyCode: 57 });
KEYBOARD_KEYS.set(KeyboardKey.Backspace, { key: ['Backspace'], keyCode: 8 });
// older versions of IE have a slightly different ESCAPE Key definition implemented
KEYBOARD_KEYS.set(KeyboardKey.Escape,    { key: ['Escape', 'Esc'], keyCode: 27 });
