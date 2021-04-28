import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-topic-cloud-dialog',
  templateUrl: './topic-cloud-dialog.component.html',
  styleUrls: ['./topic-cloud-dialog.component.scss']
})
export class TopicCloudDialogComponent implements OnInit {

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
