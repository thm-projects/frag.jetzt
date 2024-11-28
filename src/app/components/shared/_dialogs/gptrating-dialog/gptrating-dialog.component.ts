import { Component, QueryList, ViewChildren } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { GptService } from 'app/services/http/gpt.service';
import { Observable, map } from 'rxjs';

@Component({
  selector: 'app-gptrating-dialog',
  templateUrl: './gptrating-dialog.component.html',
  styleUrls: ['./gptrating-dialog.component.scss'],
  standalone: false,
})
export class GPTRatingDialogComponent {
  @ViewChildren(MatIcon) children: QueryList<MatIcon>;
  protected text: string = '';
  private visibleRating = 0;
  private listeningToMove = true;

  constructor(
    private dialogRef: MatDialogRef<GPTRatingDialogComponent>,
    private gptService: GptService,
  ) {}

  public static open(
    dialog: MatDialog,
    gptService: GptService,
    allowUpdate = false,
  ): Observable<MatDialogRef<GPTRatingDialogComponent>> {
    return gptService.getRating().pipe(
      map((e) => {
        const hasVoted = e?.ratingText || e?.rating;
        if (hasVoted && !allowUpdate) {
          return null;
        }
        const dialogRef = dialog.open(GPTRatingDialogComponent, {
          maxWidth: '95vw',
          width: '600px',
        });
        dialogRef.componentInstance.visibleRating = e?.rating || 0;
        dialogRef.componentInstance.text = e?.ratingText || '';
        return dialogRef;
      }),
    );
  }

  protected onMouseLeave() {
    this.listeningToMove = true;
  }

  protected onClick(index: number, event: MouseEvent) {
    const elem = this.children.get(index)._elementRef.nativeElement;
    if (
      this.listeningToMove ||
      this.visibleRating < index ||
      this.visibleRating > index + 1
    ) {
      this.listeningToMove = false;
      const x = Math.trunc(event.offsetX / (elem.clientWidth / 3));
      this.visibleRating = index + x / 2;
    } else {
      this.visibleRating += 0.5;
      if (this.visibleRating > index + 1) {
        this.visibleRating = index;
      }
    }
    elem.classList.add('bounce');
    elem.addEventListener(
      'animationend',
      () => {
        elem.classList.remove('bounce');
      },
      { once: true },
    );
  }

  protected onMouseMove(index: number, event: MouseEvent) {
    if (!this.listeningToMove) {
      return;
    }
    const elem = this.children.get(index)._elementRef.nativeElement;
    const x = Math.trunc(event.offsetX / (elem.clientWidth / 3));
    this.visibleRating = index + x / 2;
  }

  protected getIcon(index: number) {
    if (this.visibleRating >= index + 1) {
      return 'star_full';
    }
    return this.visibleRating > index ? 'star_half' : 'star_border';
  }

  protected submit() {
    this.gptService.makeRating(this.visibleRating, this.text).subscribe();
    this.dialogRef.close();
  }
}
