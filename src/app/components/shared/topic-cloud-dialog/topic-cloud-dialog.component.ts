import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-topic-cloud-dialog',
  templateUrl: './topic-cloud-dialog.component.html',
  styleUrls: ['./topic-cloud-dialog.component.scss']
})
export class TopicCloudDialogComponent implements OnInit {
  public panelOpenState = false;
  public edit: boolean;
  public newKeyword = '';

  public array = [
    {
      keywordID: 1,
      keyword: "Cloud",
      questions: [
        "Wie genau ist die Cloud aufgebaut?",
        "Wieviel speicherplatz steht mir in der Cloud zur verfuegung?",
        "Sollen wir die Tag Cloud implementieren?"
      ]
    },
    {
      keywordID: 2,
      keyword: "SWT",
      questions: [
        "Muss man fuer das Modul SWT bestanden haben?"
      ]
    },
    {
      keywordID: 3,
      keyword: "Frage",
      questions: [
        "Das ist eine Lange Frage mit dem Thema 'frage'",
        "Ich habe eine Frage, sind Fragen zum thema 'Frage' auch erlaubt?",
        "Ich wollte Fragen ob sie gerne Sachen gefragt werden",
        "Langsam geht mir die Fragerei mit den ganzen Fragen auf den Geist"
      ]
    },
    {
      keywordID: 4,
      keyword: "Klausur",
      questions: [
        "Darf man in der Klausur hilfmittel verwenden?",
        "An welchem Termin findet die Klausur statt?"
      ]
    }
  ];

  constructor() { }

  ngOnInit(): void {
    this.panelOpenState = false;
    this.edit = false;
  }

  editKeyword(id: number): void {
      console.log("keyword with ID "+id+" has been edited");
      this.edit = true;
  }

  deleteKeyword(id: number): void {
      console.log("keyword with ID "+id+" has been deleted");
  }

  cancelEdit(): void {
    console.log("edit canceled");
    this.edit = false;
  }

  confirmEdit(): void {
    console.log("edit confirmed");
    this.array[0].keyword = this.newKeyword;
    this.edit = false;
  }

  openConfirmDialog(): void {
    console.log("are u sure?");
  }
}
