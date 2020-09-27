

[TOC]





# Making HTML elements a11y

### Example (meeting_room) for Buttons

```html
<button mat-button *ngIf="user && deviceType === 'desktop'" [matMenuTriggerFor]="userMenu" aria-labelledby="meeting_room"></button>

<!--Hidden Div's for a11y-Descriptions-->
<div class="visually-hidden">
  <div id="meeting_room">{{'header.a11y-meeting_room' | translate}}</div>
</div>
```

### style.sccs

```scss
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  left: -10000px;
}

```

### Dynamic ARIA labels

Dynamic Aria labels like used in generic components are also possible! 

For usage only the `attr.` tag prefix must be added like in following code example:

```html
<button
      mat-button
      attr.aria-labelledby="{{ ariaPrefix + 'cancel' }}"
...
...
<div id="{{ ariaPrefix + 'cancel'}}">{{ buttonsLabelSection + '.cancel-description' | translate }}</div>
```


@see: [Accessible components: #2 dynamic ARIA labels](https://blog.prototypr.io/accessible-components-2-dynamic-aria-labels-6bf281f26d17)


### Live Announcer

#### To Add Live Announcer you need to import:

``import { LiveAnnouncer } from '@angular/cdk/a11y';``

##### And add to the constructor:
```typescript
constructor(
    ...
    private liveAnnouncer: LiveAnnouncer) { 
    ...
}
```

#### You also need to add to the `ngOnInit()` - Function:

```typescript
ngOnInit() {
    ...
    this.announce();
}
```

#### And this is the function to start the announcement:

```typescript
public announce() {
    this.liveAnnouncer.announce('Willkommenstext', 'assertive');
}
```



#### Problems with JAWS and Microsoft Speech

JAWS and Microsoft Speech cannot play the "title" attributes. Only NVDA plays the "title" attribute.
Attribute "aria-label" does not work with multi-language titles, voice output reads registered string directly 1 to 1.
`aria-labelledby` works finde with Microsoft Speech, JAWS and NVDA. If "title" attribute is additionally set, NVDA plays the text twice.



### Keyboard Shortcut

To enter Keyboard Shortcuts you first need to import `Renderer2`, `InDestroy` and the `EventService` form `angular/core`:
```typescript
import { Component, OnInit, OnDestroy, Renderer2 } from '@angular/core';
import { EventService } from '../../../services/util/event.service';
```

After that you also need to add it to the constructor
```typescript
constructor(
    ...
    private eventService: EventService,
    private _r: Renderer2){
        ...
}
    }
```

When this is done you need to add a listener to the ``ngOnInit()`` function.

Example:

```typescript
ngOnInit() {
    ...
    // But first you need to add a variable:
    listenerFn: () => void;
    // listenerFn is for closing the listener in the ngOnDestroy() function when leaving the page
    
    // Example of start-page 
    this.listenerFn = this._r.listen(document, 'keyup', (event) => {
      if (event.keyCode === 49 && this.eventService.focusOnInput === false) {
        document.getElementById('session_id-input').focus();
      } else if (event.keyCode === 51 && this.eventService.focusOnInput === false) {
        document.getElementById('new_session-button').focus();
      } else if (event.keyCode === 52 && this.eventService.focusOnInput === false) {
        document.getElementById('language-menu').focus();
      } else if ((event.keyCode === 57 || event.keyCode === 27) && this.eventService.focusOnInput === false) {
        this.announce();
      } else if (event.keyCode === 27 && this.eventService.focusOnInput === true) {
        document.getElementById('session_enter-button').focus();
      }
    });
}

// HTML Code:

<button id="session_enter-button" ...>
    ...
</button>

// 'focusOnInput' is a boolean variable which should be triggered when an input element is focused and unfocused
// Example of room-join.component.html
<input id="session_id-input" matInput #roomId   (focus)="eventService.makeFocusOnInputTrue()" 
                                                (blur)="eventService.makeFocusOnInputFalse()"
             .../>
             
// ngOnDestroy function for closing the listener when leaving the page
ngOnDestroy() {
    this.listenerFn();
 }
```

## HTML5 Accessibility: aria-hidden and role=”presentation”

A page about `aria-hidden` and `role="presentation"` attribute usage tests:

Source: [HTML5 Accessibility: aria-hidden and role=”presentation”](http://john.foliot.ca/aria-hidden/)

