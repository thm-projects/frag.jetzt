import { Component, Input, OnInit } from '@angular/core';
import { LivepollSession } from '../../../../../../models/livepoll-session';
import { LivepollService } from '../../../../../../services/http/livepoll.service';
import { templateEntries } from '../../../../../../models/livepoll-template';

@Component({
  selector: 'app-livepoll-compare',
  templateUrl: './livepoll-compare.component.html',
  styleUrls: ['./livepoll-compare.component.scss'],
})
export class LivepollCompareComponent implements OnInit {
  @Input() left: LivepollSession;
  @Input() right: LivepollSession;
  public leftResults: number[] = [];
  public rightResults: number[] = [];

  constructor(public readonly livepollService: LivepollService) {}

  get length(): number {
    return Math.max(this.leftResults.length, this.rightResults.length);
  }

  get zip(): {
    left: number;
    right: number;
    leftSymbol: string;
    rightSymbol: string;
  }[] {
    const leftTemplate = templateEntries[this.left.template];
    const rightTemplate = templateEntries[this.right.template];
    console.log(leftTemplate, rightTemplate);
    return [];
  }

  ngOnInit(): void {
    this.livepollService.getResults(this.left.id).subscribe((left) => {
      this.livepollService.getResults(this.right.id).subscribe((right) => {
        this.leftResults = left;
        this.rightResults = right;
      });
    });
  }
}
