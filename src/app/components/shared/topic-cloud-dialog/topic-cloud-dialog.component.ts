import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-topic-cloud-dialog',
  templateUrl: './topic-cloud-dialog.component.html',
  styleUrls: ['./topic-cloud-dialog.component.scss']
})
export class TopicCloudDialogComponent implements OnInit {
  public panelOpenState = false;
  public array = [
    {
      "keyword": "Cloud",
      "questions": [
        "Wie genau ist die Cloud aufgebaut?",
        "Wieviel speicherplatz steht mir in der Cloud zur verfuegung?",
        "Sollen wir die Tag Cloud implementieren?"
      ]
    },
    {
      "keyword": "SWT",
      "questions": [
        "Muss man fuer das Modul SWT bestanden haben?"
      ]
    },
    {
      "keyword": "Frage",
      "questions": [
        "Das ist eine Lange Frage mit dem Thema 'frage'",
        "Ich habe eine Frage, sind Fragen zum thema 'Frage' auch erlaubt?",
        "Ich wollte Fragen ob sie gerne Sachen gefragt werden",
        "Langsam geht mir die Fragerei mit den ganzen Fragen auf den Geist"
      ]
    },
    {
      "keyword": "Klausur",
      "questions": [
        "Darf man in der Klausur hilfmittel verwenden?",
        "An welchem Termin findet die Klausur statt?"
      ]
    }
  ];

  constructor() { }

  ngOnInit(): void {
  }

  editKeyWord(id: number): void{
      console.log("keyword with ID "+id+" has been edited");
  }

  deleteKeyWord(id: number): void{
      console.log("keyword with ID "+id+" has been deleted");
  }
}
