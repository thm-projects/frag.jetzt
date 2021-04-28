import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-topic-cloud-dialog',
  templateUrl: './topic-cloud-dialog.component.html',
  styleUrls: ['./topic-cloud-dialog.component.scss']
})
export class TopicCloudDialogComponent implements OnInit {

<<<<<<< HEAD
  public panelOpenState: boolean;
  
  keywords = [
    {
      keywordID: '0',
      titel: 'Frage',
      questions: ['what is your question', 'where are u from']
    },
    {
      keywordID: '1',
      titel: 'Klausur',
      questions: ['hast du gelernt', 'ein test']
    },
    {
      keywordID: '2',
      titel: 'Hobby',
      questions: ['was ist dein Hobby', 'was ist dein Plan']
    }
  ]

  public panelOpenState = false;
  public array = [
    {
      "keyword": "Cloud",
      "correspondingQuestions": [
        "Wie genau ist die Cloud aufgebaut?",
        "Wieviel speicherplatz steht mir in der Cloud zur verfuegung?",
        "Sollen wir die Tag Cloud implementieren?"
      ]
    },
    {
      "keyword": "SWT",
      "correspondingQuestions": [
        "Muss man fuer das Modul SWT bestanden haben?"
      ]
    },
    {
      "keyword": "Frage",
      "correspondingQuestions": [
        "Das ist eine Lange Frage mit dem Thema 'frage'",
        "Ich habe eine Frage, sind Fragen zum thema 'Frage' auch erlaubt?",
        "Ich wollte Fragen ob sie gerne Sachen gefragt werden",
        "Langsam geht mir die Fragerei mit den ganzen Fragen auf den Geist"
      ]
    },
    {
      "keyword": "Klausur",
      "correspondingQuestions": [
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
