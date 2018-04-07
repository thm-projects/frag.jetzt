import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-markdown-toolbar',
  templateUrl: './markdown-toolbar.component.html',
  styleUrls: ['./markdown-toolbar.component.scss']
})
/**
 * Component offering markdown action buttons for a textarea.
 * Associated via input attribute containing the textare's HTML id.
 */
export class MarkdownToolbarComponent {
  /**
   * HTML id associated to the marked up textarea
   */
  @Input() textareaId: string;
  /**
   * Associated textarea
   */
  textarea: HTMLTextAreaElement;

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

  /**
   * Gets called in template, run action when a button gets pressed
   * @param $event
   * @param button
   */
  onClick($event, button) {
    // Get the associated textarea element. See function documentation for further information
    this.updateTextarea();

    // Prevent all default actions (form submission, ..)
    $event.preventDefault();
    if (!this.textarea) {
      // Cancel the action click in case there is no associated textarea
      console.log(`MarkdownToolbar: textarea with id '${this.textareaId}' not found.`);
      return;
    }

    // Get the textarea's text selection positions (no selection when selectionStart == selectionEnd)
    const selectionStart = this.textarea.selectionStart;
    const selectionEnd = this.textarea.selectionEnd;
    // Get textarea's value
    const text = this.textarea.value;

    // Insert the action's text at the cursor's position
    this.textarea.value = [text.slice(0, selectionStart), button.textBefore, text.slice(selectionStart, selectionEnd),
      button.textAfter, text.slice(selectionEnd)].join('');
    // Focus the textarea
    this.textarea.focus();
    // Calculate the new cursor position (based on the action's text length and the previous cursor position)
    const cursorPosition = selectionStart + button.textBefore.length;
    // Set the cursor to the calculated position
    this.textarea.setSelectionRange(cursorPosition, cursorPosition);
  }

  /**
   * Get the textarea by its id in case it isn't already initialized.
   * The angular material tab element uses portal hosts to keep the DOM free of inactive tabs which makes it impossible to retrieve the
   * element once in the `AfterViewInit`. As this component gets used in the tab element we retrieve the textarea on button clicks as this
   * makes sure the associated area is in the DOM too.
   * See https://github.com/angular/material2/issues/731 for reference.
   */
  private updateTextarea() {
    if (!this.textarea) {
      this.textarea = document.getElementById(this.textareaId) as HTMLTextAreaElement;
    }
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
