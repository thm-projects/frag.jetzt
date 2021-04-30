import { Component, OnInit } from '@angular/core';
import {Keyword} from './keyword';
import { MatDialogRef } from '@angular/material/dialog';
import { HeaderComponent } from '../header/header.component';
import { NotificationService } from '../../../services/util/notification.service';

@Component({
  selector: 'app-topic-cloud-dialog',
  templateUrl: './topic-cloud-dialog.component.html',
  styleUrls: ['./topic-cloud-dialog.component.scss']
})
export class TopicCloudDialogComponent implements OnInit {
  public panelOpenState = false;
  newKeyword: string = '';
  edit: boolean = false;
  keywords: Keyword[] = [];

  constructor(public matdialogRef: MatDialogRef<HeaderComponent>,
              private notificationService: NotificationService) { }

  ngOnInit(): void {
    if (this.keywords.length > 0){
        this.notificationService.show("there are no keywords");
        this.matdialogRef.close();
    }
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
          keywordID: id,
          keyword: key,
          questions: questions
      }
      this.keywords.push(_keyword);
  }

  editKeyword(): void {
      this.edit = true;
  }

  deleteKeyword(id: number): void{
    this.keywords.map(keyword => {
      if (keyword.keywordID == id)
          this.keywords.splice(this.keywords.indexOf(keyword, 0), 1);
    });
    if (this.keywords.length == 0)
      this.matdialogRef.close();
  }

  cancelEdit(): void {
    console.log("edit canceled");
    this.edit = false;
  }

  confirmEdit(id: number): void {
    console.log("edit confirmed "+id);
    this.keywords.map(keyword => {
      if (keyword.keywordID == id)
          keyword.keyword = this.newKeyword;
    });
    this.edit = false;
    this.newKeyword = '';
  }

  openConfirmDialog(): void {
    console.log("are u sure?");
  }
}
