import { Component, OnInit } from '@angular/core';
import { Room } from '../../../../models/room';
import { CommentService } from '../../../../services/http/comment.service';
import { Comment } from '../../../../models/comment';
import { SpacyService } from '../../../../services/http/spacy.service';
import { TSMap } from 'typescript-map';

export interface WorkTask {
  room: Room;
  comments: Comment[];
}

@Component({
  selector: 'app-worker-dialog',
  templateUrl: './worker-dialog.component.html',
  styleUrls: ['./worker-dialog.component.scss']
})
export class WorkerDialogComponent implements OnInit {

  isRunning = false;
  taskQueue: WorkTask[] = [];
  closeCallback: any = null;

  constructor(private commentService: CommentService,
              private spacyService: SpacyService) {
  }

  ngOnInit(): void {
  }

  _callNextInQueue(): void {
    if (!this.isQueueEmpty()) {
      this.isRunning = true;
      const task = this.taskQueue[0];
      this.runWorkTask(task);
    } else {
      this.isRunning = false;
      setTimeout(() => this.close(), 2000);
    }
  }

  addWorkTask(room: Room): void {
    if (this.taskQueue.find((t: WorkTask) => t.room.id === room.id)) {
      return;
    }

    this.commentService.getAckComments(room.id).subscribe((comments: Comment[]) => {
      const task: WorkTask = {room, comments};

      // TEST
      //for (let i = 0 ; i < 5 ; i++) {
      this.taskQueue.push(task);
      //}

      if (!this.isRunning) {
        this._callNextInQueue();
      }
    });
  }

  runWorkTask(task: WorkTask): void {
    task.comments.forEach((c: Comment) => {
      const model = 'de';
      const text = c.body;
      this.spacyService.getKeywords(text, model).subscribe((keywords: string[]) => {
        const changes = new TSMap<string, string>();
        changes.set('keywordsFromSpacy', JSON.stringify(keywords));
        this.taskQueue = this.taskQueue.slice(1, this.taskQueue.length);

        // TEST:
        // this._callNextInQueue();
        this.commentService.patchComment(c, changes).subscribe(rt => {
          console.log('PATCHED .........................');
          this._callNextInQueue();
        });
      });
    });
  }

  getNumberInQueue() {
    return this.taskQueue.length;
  }

  isQueueEmpty(): boolean {
    return this.taskQueue.length === 0;
  }

  close(): void {
    if (this.closeCallback) {
      this.closeCallback();
    }
  }

  getCloseCallback(callback: () => void): void {
    this.closeCallback = callback;
  }

}

