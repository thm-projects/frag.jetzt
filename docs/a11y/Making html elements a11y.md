### Problems

JAWS and Microsoft Speech cannot play the "title" attributes. Only NVDA plays the "title" attribute.<br>
Attribute "aria-label" does not work with multi-language titles, voice output reads registered string directly 1 to 1.<br>
"aria-labelledby" works finde with Microsoft Speech, JAWS and NVDA. If "title" attribute is additionally set, NVDA plays the text twice.<br>

### Example (meeting_room) for Buttons

```
<button mat-button *ngIf="user && deviceType === 'desktop'" [matMenuTriggerFor]="userMenu" aria-labelledby="meeting_room"></button>

<!--Hidden Div's for a11y-Descriptions-->
<div class="visually-hidden">
  <div id="meeting_room">{{'header.a11y-meeting_room' | translate}}</div>
</div>
```

### style.sccs

```
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

```
<button
      mat-button
      attr.aria-labelledby="{{ ariaPrefix + 'cancel' }}"
...
...
<div id="{{ ariaPrefix + 'cancel'}}">{{ buttonsLabelSection + '.cancel-description' | translate }}</div>
```


@see https://blog.prototypr.io/accessible-components-2-dynamic-aria-labels-6bf281f26d17


### Live Announcer

##### To Add Live Announcer you need to import:
``import { LiveAnnouncer } from '@angular/cdk/a11y';``

##### And add to the constructor:
```
constructor(
    ...
    private liveAnnouncer: LiveAnnouncer) { 
    ...
}
```

##### You also need to add to the ngOnInit() - Function:
```
ngOnInit() {
    ...
    this.announce();
}
```

##### And this is the function to start the announcement:
```
public announce() {
    this.liveAnnouncer.announce('Willkommenstext', 'assertive');
}
```