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
    const supportsKeyAttribute: boolean = (event.key !== undefined);

    return keys.filter(key => {
      const keyDefinition: IKeyboardKey = KEYBOARD_KEYS.get(key);

      return (supportsKeyAttribute === true
        ? (keyDefinition.key.indexOf(event.key) !== -1) // new browser event
        : (event.keyCode === keyDefinition.keyCode) // old browser event support
      );
    }).length > 0;
  }
}
