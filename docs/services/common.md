# Working with shared services in frag.jetzt

To illustrate working with shared services, we will try to create a sample component with trivial code.

## The component itself

The component itself is created with angular. `ng generate component Example` or via an assistant.

The following files should be generated:
 - HTML
```html
<p>example works!</p>
```
 - SCSS
 - TypeScript test file
 - TypeScript
```ts
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-example',
  templateUrl: './example.component.html',
  styleUrls: ['./example.component.scss']
})
export class ExampleComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}
```

## Access to the current user

You need access to the [AuthenticationService](../../src/app/services/http/authentication.service.ts), so add it to the constructor.
You can now receive the user via `getUser()` or also receive updates with `watchUser`.

Example:

```ts
import { AuthenticationService } from '../../../services/http/authentication.service';

...

  constructor(
    private authenticationService: AuthenticationService,
  ) { }

  ngOnInit(): void {
    this.authenticationService.watchUser.subscribe(user => {
      if (user?.isGuest) {
        console.log('New guest account');
      }
    });
  }
```

## Access to the current room

You need access to the [SessionService](../../src/app/services/util/session.service.ts), so add it to the constructor.
You can now receive the room with `currentRoom`, but be aware that the room might not be loaded when you try to access it.
So it is recommended to use `getRoomOnce()` first to make sure a room has been fetched and loaded.

If you want to continuously get room changes and more, which only makes sense within services, you can use `getRoom()`.

Example:

```ts
import { SessionService } from '../../../services/util/session.service';

...

  constructor(
    private sessionService: SessionService,
  ) { }

  ngOnInit(): void {
    this.sessionService.getRoomOnce().subscribe(currentRoom => {
      if (!currentRoom.directSend) {
        console.log('Inform the user that their comment will be reviewed before they can see it.');
      }
      // ... some other stuff
      const room = this.sessionService.currentRoom; // same as currentRoom
      if (room.brainstormingSession.active) {
        console.log('Ask the user if they would like to participate in the brainstorming session.');
      }
    });
  }
```

## Access to the current room data and its updates

You need access to the [RoomDataService](../../src/app/services/util/room-data.service.ts), so add it to the constructor.
You can now receive the room data with `getCurrentRoomData()`, but be aware that the data might not be loaded when you try to access it.
So it is recommended to use `getRoomDataOnce()` first to make sure data has been fetched and loaded.
You can also decide, whether you want to receive new comments with the freezed flag (is set to false by default, so you will receive new comments).

You can receive updates from comments using the `receiveUpdates()` method, which receives update intentions that you want to listen for.

Example:

```ts
import { RoomDataService } from '../../../services/util/room-data.service';

...

  constructor(
    private roomDataService: RoomDataService,
  ) { }

  ngOnInit(): void {
    this.roomDataService.getRoomDataOnce(true, true).subscribe(comments => {
      console.log('New freezed (Only comment updates, no new comments) moderated comments', comments);
    });
    this.roomDataService.receiveUpdates([
      { type: 'CommentCreated', finished: true },
      { type: 'CommentPatched', subtype: 'highlighted' }
    ]).subscribe(info => {
      console.log('Received comment event for ' + info.comment.id);
    });
  }
```

## Filtering data

You need access to the [RoomDataFilterService](../../src/app/services/util/room-data-filter.service.ts), so add it to the constructor.
Currently, the service is executed only for one component, so all components receive the data of the last applied filter.
You can set the filter using the `currentFilter` property. But make sure that you have subscribed the filtered comments with `getData()` before.
Otherwise you can access the data via `currentData`.

Example:

```ts
import { RoomDataFilterService } from '../../../services/util/room-data-filter.service';
import { FilterType } from '../../../services/util/room-data-filter';

...

  constructor(
    private roomDataFilterService: RoomDataFilterService,
  ) { }

  ngOnInit(): void {
    this.roomDataFilterService.getData().subscribe(result => {
      console.log('Received new filtered and sorted comments', result.comments);
    });
    const filter = this.roomDataFilterService.currentFilter;
    filter.filterType = FilterType.tag;
    filter.filterCompare = 'Technisch';
    // Apply the filter to only receive comments with the 'Technisch' tag
    this.roomDataFilterService.currentFilter = filter;
  }
```

## Accessing device information

You need access to the [DeviceInfoService](../../src/app/services/util/device-info.service.ts), so add it to the constructor.

Example (Note that you can switch device in the DevTools):

TypeScript file:
```ts
import { DeviceInfoService } from '../../../services/util/device-info.service';

...

  constructor(
    public deviceInfo: DeviceInfoService,
  ) { }
```

HTML file:
```html
<p *ngIf="deviceInfo.isCurrentlyDesktop">Very long description because you have the very large space</p>
<p *ngIf="deviceInfo.isCurrentlyMobile">Short description</p>
```

## How to change filtering

In the [RoomDataFilter file](../../src/app/services/util/room-data-filter.ts) you can add new filter and sort types.
To implement their functionality, you need to add their function to the specific stage.
The stages are located inside the [RoomDataFilterService](../../src/app/services/util/room-data-filter.service.ts).

For example, for filtering, you can find the stage inside the `filterType()` function.

## Translation not working?

The main component on each route and sometimes even subcomponents and dialogs need their own translation management.
To fix this problem, you need to add the `TranslateService` from `@ngx-translate/core` and the `LanguageService` into the constructor.
Inside the constructor you can add the following code to make the translation work:

```ts
import { LanguageService } from '../../../services/util/language.service';
import { TranslateService } from '@ngx-translate/core';

...

  constructor(
    private languageService: LanguageService,
    private translateService: TranslateService,
  ) {
    languageService.getLanguage().subscribe(lang => translateService.use(lang));
  }
```

## Extending the header

You can easily extend the header with a few lines of code. Here is an example:

```ts
import { Component, ComponentRef, OnDestroy, OnInit } from '@angular/core';
import { ArsComposeService } from '../../../../../projects/ars/src/lib/services/ars-compose.service';
import { HeaderService } from '../../../services/util/header.service';


@Component({
  selector: 'app-example',
  templateUrl: './example.component.html',
  styleUrls: ['./example.component.scss']
})
export class ExampleComponent implements OnInit, OnDestroy {

  private _list: ComponentRef<any>[];

  constructor(
    private composeService: ArsComposeService,
    private headerService: HeaderService,
  ) {
  }

  ngOnInit(): void {
    this.initNavigation();
  }

  ngOnDestroy() {
    this._list?.forEach(e => e.destroy());
  }

  private initNavigation(): void {
    this._list = this.composeService.builder(this.headerService.getHost(), e => {
      e.menuItem({
        translate: this.headerService.getTranslate(),
        icon: 'add',
        class: 'header-icons material-icons-outlined',
        text: 'header.create-question',
        callback: () => console.log('Open create question dialog'),
        condition: () => true // always show button
      });
    });
  }

}
```
