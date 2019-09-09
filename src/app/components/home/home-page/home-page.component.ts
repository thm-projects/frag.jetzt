import { Component, OnInit, Renderer2 } from '@angular/core';
import { EventService } from '../../../services/util/event.service';
import { LiveAnnouncer } from '@angular/cdk/a11y';

@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.scss']
})
export class HomePageComponent implements OnInit {

  deviceType: string;

  constructor(
    private eventService: EventService,
    private liveAnnouncer: LiveAnnouncer,
    private _r: Renderer2
  ) {
  }



  ngOnInit() {
    this.deviceType = localStorage.getItem('deviceType');
    this.announce();
    if (!this.eventService.focusOnInput) {
      this._r.listen(document, 'keyup', (event) => {
        if (event.keyCode === 49) {
          document.getElementById('session_id-input').focus();
        } else if (event.keyCode === 51) {
          document.getElementById('new_session-button').focus();
        } else if (event.keyCode === 52) {
          document.getElementById('language-menu').focus();
        } else if (event.keyCode === 57 || event.keyCode === 27) {
          this.announce();
        }
      });
    }
  }

  public announce() {
    // this.liveAnnouncer.announce('Willkommen auf dieser Seite' + document.getElementById('announcer_text').textContent, 'assertive');
    this.liveAnnouncer.announce('Sie befinden sich auf der Startseite von frag Punkt jetzt. ' +
      'Drücken Sie die Taste 1, um einen Sitzungs-Code einzugeben, die Taste 2 um auf das Sitzungs-Menü zu gelangen,' +
      'die Taste 3 um eine neune Sitzung zu erstellen, die Taste 4 um zur Sprachauswahl zu gelangen, ' +
      'oder die Taste 9 um diese Ansage zu wiederholen.', 'assertive');
  }
}
