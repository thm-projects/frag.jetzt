/**
 * A basic keyboard key definition.
 */
export interface IKeyboardKey {
  /**
   * @see https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key
   */
  key: string[];
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
  Backspace,
  Enter,
}

type KeyOfKeyboardKey = keyof typeof KeyboardKey;

// Setup all application available keyboard keys here
// @see https://keycode.info/ for easy keyboard key detection
// A map of available keyboard keys for the application
export const KEYBOARD_KEYS: {[key in KeyOfKeyboardKey]: IKeyboardKey}  = {
  Digit0: { key: ['0'] },
  Digit1: { key: ['1'] },
  Digit2: { key: ['2'] },
  Digit3: { key: ['3'] },
  Digit4: { key: ['4'] },
  Digit5: { key: ['5'] },
  Digit6: { key: ['6'] },
  Digit7: { key: ['7'] },
  Digit8: { key: ['8'] },
  Digit9: { key: ['9'] },
  Escape: { key: ['Escape', 'Esc'] },
  Backspace: { key: ['Backspace'] },
  Enter: { key: ['Enter'] },
};
