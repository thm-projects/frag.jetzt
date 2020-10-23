import { Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-motd-temp-dialog',
  templateUrl: './motd-temp-dialog.component.html',
  styleUrls: ['./motd-temp-dialog.component.scss']
})
export class MotdTempDialogComponent implements OnInit {

  public content: string;

  public de = '# Serverwechsel\n' +
    '\n' +
    'Liebe User von »frag.jetzt«,\n' +
    '\n' +
    'wir freuen uns sehr, dass unser neues Audience-Response-System ' +
    'bei Ihnen so gut ankommt!\n' +
    '\n' +
    'Es gibt Tage, an denen 2.000 Benutzer unsere App nutzen. ' +
    'Mehr als 700 Lehrerinnen und Lehrer aus Deutschland, ' +
    'Österreich und der Schweiz nutzen "frag.jetzt" im ' +
    'Online-Unterricht. Das macht uns sehr stolz und hat ' +
    'uns veranlasst, einen leistungsfähigeren Server einzurichten, ' +
    'um dem weiteren Andrang gerecht zu werden.\n' +
    '\n' +
    '**Kurz gesagt: Wir werden am 15. ' +
    'November umziehen. Sie werden davon nichts merken, denn die ' +
    'Adresse https://frag.jetzt bleibt gleich.**\n' +
    '\n' +
    'Wenn Sie die Fragen aus Ihren alten Sitzungen ' +
    'speichern wollen, müssen Sie sie bis zum Serverwechsel exportieren. ' +
    'Gehen Sie dazu auf die Eingangsseite Ihrer Sitzung, klicken ' +
    'Sie auf das Zahnradsymbol oben rechts und dann auf die Option ' +
    '»Fragen«. Die exportierte Datei kann mit Excel, ' +
    'Numbers oder LibreOffice weiterverarbeitet werden. ' +
    'Alle Markierungen, Bewertungen und Bonusmarken werden mit exportiert.\n' +
    '\n' +
    'Wenn Sie Fragen zum Serverwechsel haben oder uns ein Feedback zur App geben möchten, besuchen Sie bitte die Sitzung 11 22 33 44.\n' +
    '\n' +
    'Ihr »frag.jetzt«-Team\n';

  public en = '# Server change\n' +
    '\n' +
    'Dear users of »frag.jetzt«,\n' +
    '\n' +
    'We are very pleased that our new audience response ' +
    'app is so well received by you!\n' +
    '\n' +
    'There are days when 2,000 users use our app. ' +
    'More than 700 teachers from Germany, Austria ' +
    'and Switzerland use "frag.jetzt" in online lessons.' +
    ' This makes us very proud and has prompted us to set ' +
    'up a more powerful server to cope with the continued rush.\n' +
    '\n' +
    '**In short: We will move on November 15th. ' +
    'You won\'t notice anything of this, because ' +
    'the address https://frag.jetzt will remain the same.**\n' +
    '\n' +
    'If you want to save the questions from your ' +
    'old sessions, you have to export them ' +
    'until the server change. To do this, go to the home page' +
    ' of your session, click on the gear icon in the top' +
    ' right corner and then on the »Questions« option.' +
    ' The exported file can be further processed with Excel, ' +
    'Numbers or Libre Office. All markers, ratings and bonus tokens' +
    ' are exported with it.\n' +
    '\n' +
    'If you have any questions about the ' +
    'server change or want to give us feedback on ' +
    'the app, please visit session 11 22 33 44.\n' +
    '\n' +
    'Your »frag.jetzt« team\n';

  constructor(
    public dialogRef: MatDialogRef<MotdTempDialogComponent>,
    public dialog: MatDialog
  ) { }


  buildDeclineActionCallback(): () => void {
    return () => this.dialogRef.close();
  }

  ngOnInit(): void {
    if (localStorage.getItem('currentLang') === 'de') {
      this.content = this.de;
    } else {
      this.content = this.en;
    }
  }

}
