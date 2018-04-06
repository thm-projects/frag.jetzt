import { AfterViewInit, Component, Input, OnDestroy } from '@angular/core';

@Component({
  selector: 'app-markdown-toolbar',
  templateUrl: './markdown-toolbar.component.html',
  styleUrls: ['./markdown-toolbar.component.scss']
})
/**
 * Component offering markdown action buttons for a textarea. Associated via input attribute containing the textare's HTML id
 * First approach, to add the toolbar via directive directly to the textarea to avoid DOM traversal and listener handling, failed because
 * the injected HTML doesn't get styled. See https://github.com/angular/angular/issues/7845 for reference.
 */
export class MarkdownToolbarComponent implements AfterViewInit, OnDestroy {
  /**
   * HTML id associated to the marked up textarea
   */
  @Input() textareaId: string;
  /**
   * Associated textarea
   */
  textarea: HTMLTextAreaElement;
  /**
   * Cursor position or start of text selection in associated textarea
   * @type {number}
   */
  private selectionStart = 0;
  /**
   * Cursor position or end of text selection in associated textarea
   * @type {number}
   */
  private selectionEnd = 0;

  /**
   * Button configuration array used for template generation. See {@link Button} for further information.
   * @type {Button[]}
   */
  buttons: Button[] = [
    new Button('bold', 'Bold', 'format_bold', '**'),
    new Button('italic', 'Italic', 'format_italic', '*'),
    new Button('title', 'Title', 'title', '## ', ''),
    new Button('link', 'Link', 'insert_link', '[', '](https://...)'),
    new Button('ul', 'Unordered list', 'format_list_bulleted', '* ', ''),
    new Button('ol', 'Ordered list', 'format_list_numbered', '1. ', ''),
    new Button('code', 'Code', 'code', '`'),
    new Button('quote', 'Quote', 'format_quote', '> ', ''),
    new Button('image', 'Image', 'insert_photo', '![', '](https://...)'),
  ];

  ngAfterViewInit() {
    // Set 0-timeout to prevent 'ExpressionChangedAfterItHasBeenCheckedError'
    // See documentation (https://angular.io/guide/component-interaction#!#parent-to-view-child) for reference.
    setTimeout(() => {
      // Get the textarea by the id passed to the component
      this.textarea = document.getElementById(this.textareaId) as HTMLTextAreaElement;
      if (!this.textarea) {
        console.log(`MarkdownToolbar: textarea with id '${this.textareaId}' not found.`);
        return;
      }
      // Set blur listener to store the cursor's position (or text selection) so we can add the markdown when pressing an action button
      this.textarea.addEventListener('blur', (event) => this.updateSelection(event), true);
    }, 0);
  }

  ngOnDestroy() {
    // Remove blur listener
    this.textarea.removeEventListener('blur');
  }

  /**
   * Called by the template, run action when a button gets pressed
   * @param $event
   * @param button
   */
  onClick($event, button) {
    const text = this.textarea.value;

    // Insert the action's text at the cursor's position
    this.textarea.value = [text.slice(0, this.selectionStart), button.textBefore, text.slice(this.selectionStart, this.selectionEnd),
      button.textAfter, text.slice(this.selectionEnd)].join('');
    // Focus the textarea
    this.textarea.focus();
    // Calculate the new cursor position (based on the action's text length and the previous cursor position)
    const cursorPosition = this.selectionStart + button.textBefore.length;
    // Set the cursor to the calculated position
    this.textarea.setSelectionRange(cursorPosition, cursorPosition);
    // Prevent all default actions (form submission, ..)
    $event.preventDefault();
  }

  /**
   * Update the cursor's position (or text selection) when the textarea gets blurred.
   * Called by 'blur' listener.
   * @param event
   */
  updateSelection(event) {
    this.selectionStart = event.target.selectionStart;
    this.selectionEnd = event.target.selectionEnd;
  }
}

/**
 * Data class for markdown toolbar action buttons
 */
class Button {
  /**
   * Id used to identify the action for special behaviour
   */
  id: string;
  /**
   * Label shown to the user
   */
  label: string;
  /**
   * Icon key (material icon font) shown to the user
   */
  icon: string;
  /**
   * Text that gets placed in front of the text selection
   */
  textBefore: string;
  /**
   * Text that gets placed behind the text selection
   */
  textAfter: string;

  /**
   * Constructor for creating an instance of {@link Button}, if {@link textAfter} doesn't get passed,
   * it will be initialized with the value of {@link textBefore}
   *
   * @param {string} id
   * @param {string} label
   * @param {string} icon
   * @param {string} textBefore
   * @param {string=} textAfter optional - if not passed will be initialized with the value of {@link textBefore}
   */
  constructor(id: string, label: string, icon: string, textBefore: string, textAfter?: string) {
    this.id = id;
    this.label = label;
    this.icon = icon;
    this.textBefore = textBefore;
    // If textAfter is not set, define it with textBefore's value as markdown tags mostly get closed the way they are opened
    if (textAfter !== undefined) {
      this.textAfter = textAfter;
    } else {
      this.textAfter = textBefore;
    }
  }
}
