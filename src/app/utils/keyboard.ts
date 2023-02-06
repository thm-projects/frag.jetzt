import { KeyboardKey, KEYBOARD_KEYS, IKeyboardKey } from './keyboard/keys';

/**
 * Contains keyboard processing helper functions.
 */
export class KeyboardUtils {

  /**
   * Checks if the provided keyboard event contains one of the targeted keyboard keys and returns TRUE if so, FALSE otherwise.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent
   */
  public static isKeyEvent(event: KeyboardEvent, ...keys: KeyboardKey[]): boolean {
    return keys.some(key => KEYBOARD_KEYS[KeyboardKey[key]].key.includes(event.key));
  }
}
