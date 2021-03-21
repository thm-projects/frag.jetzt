import { CorrectWrong } from './correct-wrong.enum';
import { ViewChild } from '@angular/core';

export class Comment {
  id: string;
  roomId: string;
  creatorId: string;
  revision: string;
  body: string;
  read: boolean;
  correct: CorrectWrong;
  favorite: boolean;
  timestamp: Date;
  bookmark: boolean;
  score: number;
  createdFromLecturer: boolean;
  highlighted: boolean;
  ack: boolean;
  tag: string;
  answer: string;
  userNumber: number;
  number: number;

  constructor(roomId: string = '',
              creatorId: string = '',
              body: string = '',
              read: boolean = false,
              correct: CorrectWrong = CorrectWrong.NULL,
              favorite: boolean = false,
              creationTimestamp: Date = null,
              bookmark: boolean = false,
              score: number = 0,
              createdFromLecturer = false,
              highlighted: boolean = false,
              ack: boolean = true,
              tag: string = '',
              answer: string = '',
              userNumber: number = 0) {
    this.id = '';
    this.roomId = roomId;
    this.creatorId = creatorId;
    this.revision = '';
    this.body = body;
    this.read = read;
    this.correct = correct;
    this.favorite = favorite;
    this.bookmark = bookmark;
    this.timestamp = creationTimestamp;
    this.score = score;
    this.createdFromLecturer = createdFromLecturer;
    this.highlighted = highlighted;
    this.ack = ack;
    this.tag = tag;
    this.answer = answer;
    this.userNumber = userNumber;
  }
}
