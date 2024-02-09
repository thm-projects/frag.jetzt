import { Component, inject } from '@angular/core';
import {
  BuiltAction,
  DYNAMIC_INPUT,
  DateInputAction,
} from '../interface/multi-level-dialog.types';
import { FormControl, FormGroup, Validators } from '@angular/forms';

export enum UNITS {
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

  static fromString([hour, minute, second = 0]): TimeStamp {
    return new TimeStamp(hour, minute, second);
  }

  isAfter(other: TimeStamp): boolean {
    return (
      this.hour > other.hour ||
      (this.hour === other.hour && this.minute > other.minute) ||
      (this.hour === other.hour &&
        this.minute === other.minute &&
        this.second > other.second)
    );
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
export class MultiLevelDateInputComponent {
  data = inject(DYNAMIC_INPUT) as BuiltAction<DateInputAction>;
  usageTimes: Usage[];
  dateRangeGroup: FormGroup;
  options: Option[];

  constructor() {
    this.dateRangeGroup = new FormGroup(
      {
        startDate: new FormControl(),
        endDate: new FormControl(),
        selectedOption: new FormControl(UNITS[UNITS.WEEKDAYS]),
        startTime: new FormControl('', Validators.required),
        endTime: new FormControl('', Validators.required),
      },
      {
        validators: this.timeSpanValidator,
      },
    );
    this.usageTimes = this.data.defaultValues.map((usage) => {
      return {
        startDate: new Date(
          usage.startDate[0],
          usage.startDate[1] - 1,
          usage.startDate[2],
        ),
        endDate: new Date(
          usage.endDate[0],
          usage.endDate[1] - 1,
          usage.endDate[2],
        ),
        startDuration: TimeStamp.fromString(usage.startTime),
        endDuration: TimeStamp.fromString(usage.endTime),
        repeatDuration: usage.recurringFactor,
        repeatUnit: usage.recurringStrategy,
      };
    });
    this.options = [
      ...Object.keys(UNITS)
        .filter((key) => isNaN(Number(key)))
        .map((key) => {
          return {
            value: key,
            i18nPath: `ml-gpt-room-settings.usage-time-item-one-option-${key.toLowerCase()}`,
          };
        }),
    ];
  }

  timeSpanValidator(group: FormGroup) {
    const startDuration = group.get('startTime').value;
    const endDuration = group.get('endTime').value;

    const isCorrupt =
      startDuration &&
      endDuration &&
      TimeStamp.fromString(startDuration).isAfter(
        TimeStamp.fromString(endDuration),
      );

    if (!isCorrupt) return null;

    return { invalid: true };
  }

  formatTimeStamp(time: TimeStamp): string {
    let hour = time.hour;
    if (isNaN(hour)) hour = 0;
    let minute = time.minute;
    if (isNaN(minute)) minute = 0;

    return `${hour.toString().padStart(2, '0')}:${minute
      .toString()
      .padStart(2, '0')}`;
  }

  timeStampExists(time: TimeStamp): boolean {
    return this.usageTimes.some(
      (u) =>
        u.startDuration.hour === time.hour &&
        u.startDuration.minute === time.minute,
    );
  }

  addUsageTime(): void {
    const start = this.dateRangeGroup.get('startDate').value;
    const end = this.dateRangeGroup.get('endDate').value;

    if (start === null || end === null) return;

    const startDate = new Date(start);
    const endDate = new Date(end);

    const startDuration = TimeStamp.fromString(
      this.dateRangeGroup.get('startTime').value,
    );
    const endDuration = TimeStamp.fromString(
      this.dateRangeGroup.get('endTime').value,
    );

    if (startDuration.isAfter(endDuration)) return;

    const repeatDuration = 1;
    const repeatUnit =
      this.dateRangeGroup.get('selectedOption').value || UNITS.WEEKDAYS;

    const newUsage: Usage = {
      startDate,
      endDate,
      startDuration,
      endDuration,
      repeatDuration,
      repeatUnit,
    };

    if (this.usageTimes.length !== 0 && this.usageAlreadyExists(newUsage))
      return;
    this.usageTimes.push(newUsage);

    this.data.control.setValue([...this.usageTimes]);
    this.dateRangeGroup.reset();
  }

  usageAlreadyExists(usage: Usage): boolean {
    return this.usageTimes.some(
      (u) =>
        u.startDate.getDate() === usage.startDate.getDate() &&
        u.endDate.getDate() === usage.endDate.getDate() &&
        u.startDuration.hour === usage.startDuration.hour &&
        u.startDuration.minute === usage.startDuration.minute &&
        u.endDuration.hour === usage.endDuration.hour &&
        u.endDuration.minute === usage.endDuration.minute &&
        u.repeatDuration === usage.repeatDuration &&
        u.repeatUnit === usage.repeatUnit,
    );
  }

  deleteTime(index: number): void {
    this.usageTimes.splice(index, 1);
    this.data.control.setValue([...this.usageTimes]);
  }
}
