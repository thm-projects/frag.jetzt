# m3-dynamic-theme

> todo

# m3-dialog-builder

> todo

## Example

```ts
openDeleteCommentDialog(): void {
  this.m3DialogService
    .open({
      kind: M3DialogElementKind.Basic,
      headline: {
        kind: M3DialogElementKind.Title,
        text: 'room-page.sure',
      },
      content: [
        {
          kind: M3DialogElementKind.Description,
          text: 'comment-list.really-delete',
        }
      ],
      actions: [CANCEL_BUTTON, ACCEPT_BUTTON],
      translation: 'room',
    })
    .subscribe((result) => {
      if (result) {
        this.delete();
      }
    });
}
```
