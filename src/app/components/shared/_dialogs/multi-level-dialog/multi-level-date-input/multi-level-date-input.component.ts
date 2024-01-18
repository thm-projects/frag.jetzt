import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { BuiltAction, DYNAMIC_INPUT, DateInputAction } from '../interface/multi-level-dialog.types';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { throwToolbarMixedModesError } from '@angular/material/toolbar';
import { Time } from '@angular/common';
import { TimeInterval } from 'rxjs/internal/operators/timeInterval';

enum UNITS {
  NONE,
  DAILY,
  WEEKDAYS,
  WEEKENDS,
  MONDAYS,
  TUESDAYS,
  WEDNESDAYS,
  THURSDAYS,
  FRIDAYS,
  SATURDAYS,
  SUNDAYS,
}

interface Option {
  value: string;
  i18nPath: string;
}

class TimeStamp {
  hour: number;
  minute: number;
  second: number;

  constructor(hour = 0, minute = 0, second = 0) {
    this.hour = hour;
    this.minute = minute;
    this.second = second;
  }

  static fromString(time: string): TimeStamp {
    const [hour, minute, second] = time.split(':').map(Number);
    return new TimeStamp(hour, minute, second);
  }

  isAfter(other: TimeStamp): boolean {
    return this.hour > other.hour
      || (this.hour === other.hour && this.minute > other.minute)
      || (this.hour === other.hour && this.minute === other.minute && this.second > other.second);
  }
}

interface Usage {
  startDate: Date;
  endDate: Date;
  startDuration: TimeStamp;
  endDuration: TimeStamp;
  repeatDuration: number;
  repeatUnit: string;
}

@Component({
  selector: 'app-multi-level-date-input',
  templateUrl: './multi-level-date-input.component.html',
  styleUrls: ['./multi-level-date-input.component.scss'],
})


export class MultiLevelDateInputComponent implements OnInit {
  data = inject(DYNAMIC_INPUT) as BuiltAction<DateInputAction>;
  usageTimes: Usage[];
  dateRangeGroup: FormGroup;
  options: Option[];

  constructor() {
    this.dateRangeGroup = new FormGroup({
      startDate: new FormControl(),
      endDate: new FormControl(),
      selectedOption: new FormControl(),
      startTime: new FormControl('', Validators.required),
      endTime: new FormControl('', Validators.required),
    }, {
      validators: this.timeSpanValidator,
    });

    this.usageTimes = [];

    this.options = [
      ...Object.keys(UNITS).map((key) => ({
        value: key,
        i18nPath: `${key}`,
      })),
    ];
  }

  ngOnInit(): void {
  }

  timeSpanValidator(group: FormGroup) {
    const startDuration = group.get('startTime').value;
    const endDuration = group.get('endTime').value;

    const isCorrupt = startDuration
    && endDuration
    && TimeStamp.fromString(startDuration)
      .isAfter(TimeStamp.fromString(endDuration));

    if (!isCorrupt) return null;
    
    return { invalid: true };
  }

  addUsageTime(): void {
    const start = this.dateRangeGroup.get('startDate').value;
    const end = this.dateRangeGroup.get('endDate').value;

    if (start === null
      || end === null) return;

    const startDate = new Date(start);
    const endDate = new Date(end);
    const startDuration = TimeStamp.fromString(this.dateRangeGroup.get('startTime').value);
    const endDuration = TimeStamp.fromString(this.dateRangeGroup.get('endTime').value);

    const repeatDuration = 1;
    const repeatUnit = this.dateRangeGroup.get('selectedOption').value || UNITS.WEEKDAYS;



    this.usageTimes.push({
      startDate,
      endDate,
      startDuration,
      endDuration,
      repeatDuration,
      repeatUnit,
    });

    this.data.control.setValue([...this.usageTimes]);
  }

  deleteTime(index: number): void {
    this.usageTimes.splice(index, 1);
    this.data.control.setValue([...this.usageTimes]);
  }
}
