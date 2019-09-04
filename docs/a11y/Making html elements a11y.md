### Problems

JAWS and Microsoft Speech cannot play the "title" attributes. Only NVDA plays the "title" attribute.
Attribute "aria-label" does not work with multi-language titles, voice output reads registered string directly 1 to 1.
"aria-labelledby" works finde with Microsoft Speech, JAWS and NVDA. If "title" attribute is additionally set, NVDA plays the text twice.

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
