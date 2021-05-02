import { Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { HeaderComponent } from '../../header/header.component';
import { NotificationService } from '../../../../services/util/notification.service';
import { TopicCloudConfirmDialogComponent } from '../topic-cloud-confirm-dialog/topic-cloud-confirm-dialog.component';
import { AuthenticationService } from '../../../../services/http/authentication.service';
import { UserRole } from '../../../../models/user-roles.enum';


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
  hasAccess: boolean; 

  constructor(public cloudDialogRef: MatDialogRef<HeaderComponent>,
              public confirmDialog: MatDialog,
              private notificationService: NotificationService, 
              private authenticationService: AuthenticationService) { }

  ngOnInit(): void {
    
    if (this.authenticationService.getRole() === UserRole.CREATOR || 
        this.authenticationService.getRole() === UserRole.EDITING_MODERATOR ||
        this.authenticationService.getRole() === UserRole.EDITING_MODERATOR){
        this.hasAccess = true;
    } else {
        this.hasAccess = false;
    }

    if (this.keywords.length > 0){
        this.notificationService.show("there are no keywords");
        this.cloudDialogRef.close();
    }
    let questions = ["Wie genau ist die Cloud aufgebaut?",
    "Wieviel speicherplatz steht mir in der Cloud zur verfuegung?",
    "Sollen wir die Tag Cloud implementieren?"];
    this.pushToArray(1, "Cloud", questions);

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
      this.cloudDialogRef.close();
  }

  cancelEdit(): void {
    this.edit = false;
    this.newKeyword = '';
  }

  confirmEdit(id: number): void {
    this.keywords.map(keyword => {
      if (keyword.keywordID == id)
          keyword.keyword = this.newKeyword;
    });
    this.edit = false;
    this.newKeyword = '';
  }

  openConfirmDialog(keyword: Keyword): void {
    const confirmDialogRef = this.confirmDialog.open(TopicCloudConfirmDialogComponent, {
      data: {topic: keyword.keyword}
    });

    confirmDialogRef.afterClosed().subscribe(result => {
      console.log(`dialog result: ${result}`);
      if (result == true) {
        this.deleteKeyword(keyword.keywordID);
      }
    })
  }
}

interface Keyword {
  keywordID: number;
  keyword: string;
  questions: string[];
}
