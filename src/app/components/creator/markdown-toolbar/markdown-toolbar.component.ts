import { Component, Input } from '@angular/core';
import { MarkdownHelpDialogComponent } from '../_dialogs/markdown-help-dialog/markdown-help-dialog.component';
import { MatDialog } from '@angular/material';
import { Data, GenericDataDialogComponent } from '../../shared/_dialogs/generic-data-dialog/generic-data-dialog.component';

@Component({
  selector: 'app-markdown-toolbar',
  templateUrl: './markdown-toolbar.component.html',
  styleUrls: ['./markdown-toolbar.component.scss']
})
/**
 * Component offering markdown action buttons for a textarea.
 * Associated via input attribute containing the textarea's HTML id.
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
    new Button('bold', 'Bold', 'format_bold', '**{{TEXT}}**'),
    new Button('italic', 'Italic', 'format_italic', '*{{TEXT}}*'),
    new Button('title', 'Title', 'title', '## {{TEXT}}'),
    new Button('link', 'Link', 'insert_link', '[{{TEXT}}]({{URL}})'),
    new Button('ul', 'Unordered list', 'format_list_bulleted', '* {{TEXT}}'),
    new Button('ol', 'Ordered list', 'format_list_numbered', '1. {{TEXT}}'),
    new Button('code', 'Code', 'code', '`{{TEXT}}`'),
    new Button('quote', 'Quote', 'format_quote', '> {{TEXT}}'),
    new Button('image', 'Image', 'insert_photo', '![{{TEXT}}]({{URL}})'),
    new Button('help', 'Help', 'help', '')
  ];

  constructor(public dialog: MatDialog) { }

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

    // Init formatted string with button's format string, placeholders will be replaced later on
    let formattedString = button.format;
    // Get offset for cursor position (set the cursor to the beginning of the surrounded text)
    const cursorPosition = formattedString.indexOf('{{TEXT}}');

    // Handle different buttons here
    switch (button.id) {
      case 'help':
        // Open help dialog and prevent default action
        this.dialog.open(MarkdownHelpDialogComponent);
        break;
      case 'link':
      case 'image':
        // Open a configuration dialog
        const dialogRef = this.dialog.open(GenericDataDialogComponent, {
          data: [
            new Data('TEXT', 'Text', this.getSelectedText()),
            new Data('URL', 'URL')
          ]
        });
        // Wait for dialog to get closed..
        dialogRef.afterClosed().subscribe(result => {
          // Cancel if there is no data (dialog got closed without submitting)
          if (result === undefined) {
            return;
          }
          // Loop data entries..
          result.forEach(data => {
            // Replace placeholder with data provided by the user
            formattedString = formattedString.replace(`{{${data.id}}}`, data.value);
          });
          // Insert the formatted string and update the cursor position
          this.insertTextAtSelection(formattedString, cursorPosition);
        });
        break;
      default:
        // Replace text placeholder with the selected text (keep surrounding tags empty if there was no selection)
        formattedString = formattedString.replace('{{TEXT}}', this.getSelectedText());
        // Insert the text associated to the button and update the cursor position
        this.insertTextAtSelection(formattedString, cursorPosition);
    }
  }

  /**
   * Get the selected text of the textarea
   * @returns {string}
   */
  private getSelectedText() {
    return this.textarea.value.slice(this.textarea.selectionStart, this.textarea.selectionEnd);
  }

  /**
   * Insert the passed string at the cursor position (replaces selected text if there is any) and update the cursor's position to start
   * of the inserted text respecting the passed selection offset
   * @param {string} formattedString
   * @param {number} selectionOffset
   */
  private insertTextAtSelection(text: string, selectionOffset: number) {
    // Get the textarea's text selection positions (no selection when selectionStart == selectionEnd)
    const selectionStart = this.textarea.selectionStart;
    const selectionEnd = this.textarea.selectionEnd;
    // Get textarea's value
    const value = this.textarea.value;

    // Insert the action's text at the cursor's position
    this.textarea.value = [value.slice(0, selectionStart), text, value.slice(selectionEnd)].join('');
    // Focus the textarea
    this.textarea.focus();
    // Calculate the new cursor position (based on the action's text length and the previous cursor position)
    const cursorPosition = selectionStart + selectionOffset;
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
   * Format string
   * TODO:
   */
  format: string;

  /**
   * Constructor for creating an instance of {@link Button}
   *
   * @param {string} id
   * @param {string} label
   * @param {string} icon
   * @param {string} format
   */
  constructor(id: string, label: string, icon: string, format: string) {
    this.id = id;
    this.label = label;
    this.icon = icon;
    this.format = format;
  }
}
