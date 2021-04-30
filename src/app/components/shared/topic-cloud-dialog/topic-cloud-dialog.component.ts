import { Component, OnInit } from '@angular/core';
import {Keyword} from './keyword';

@Component({
  selector: 'app-topic-cloud-dialog',
  templateUrl: './topic-cloud-dialog.component.html',
  styleUrls: ['./topic-cloud-dialog.component.scss']
})
export class TopicCloudDialogComponent implements OnInit {
  public panelOpenState = false;
  /* public keywords = [
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
*/
  constructor() { }

  keywords: Keyword[] = [];

  ngOnInit(): void {
    let questions = ["Wie genau ist die Cloud aufgebaut?",
    "Wieviel speicherplatz steht mir in der Cloud zur verfuegung?",
    "Sollen wir die Tag Cloud implementieren?"];
    this.pushToArray(1, "cloud", questions);

    questions = ["Muss man fuer das Modul SWT bestanden haben?"];
    this.pushToArray(2, "SWTP", questions);

    questions = ["Das ist eine Lange Frage mit dem Thema 'frage'",
    "Ich habe eine Frage, sind Fragen zum thema 'Frage' auch erlaubt?",
    "Ich wollte Fragen ob sie gerne Sachen gefragt werden",
    "Langsam geht mir die Fragerei mit den ganzen Fragen auf den Geist"];
    this.pushToArray(3, "Frage", questions);
  }

  pushToArray(id: number, key: string, questions: string[]){
      let _keyword = {
          keywordID: 1,
          keyword: "test",
          questions: questions
      }

      this.keywords.push(_keyword);
  }

  editKeyword(id: number): void{
      console.log("keyword with ID "+id+" has been edited");
  }

  deleteKeyword(id: number): void{

      console.log("keyword with ID "+id+" has been deleted");
  }
}
