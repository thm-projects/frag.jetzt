import {Room} from '../../../models/room';
import {HttpClient} from '@angular/common/http';
import {Observable, of} from 'rxjs';
import {UserRole} from '../../../models/user-roles.enum';

export class Announcement {
  target: UserRole;
  room: Room;
}

export class AnnouncementService {
  constructor(
    private httpClient: HttpClient
  ) {
  }

  broadcast(message: Announcement): Observable<boolean> {
    return of(true);
  }
}

/**
 * Note:
 *  currently only SINGLE_CHOICE is used.
 *
 * SINGLE_CHOICE
 * - 1 question
 * - list of answers: string[]
 * - 1 answer can be selected
 * - 1 answer is correct
 *
 * MULTPLE_CHOICE
 * - 1 question
 * - list of answers: string[]
 * - 1 or more answers can be selected
 * - 1 or more answers are correct
 *
 * BINARY_CHOICE
 * - 1 question
 * - list of answers: string[] = ['yes','no'] => [true,false]
 * - 1 answer can be selected
 * - 1 answer is correct
 *
 * MISSING_WORD
 * - 1 statement where word in statement is missing
 * - list of answers: string[]
 *   - where missing word of statement is in answers
 * - 1 answer can be selected
 * - 1 answer is correct
 *
 * NUMERICAL_CHOICE
 * - 1 question, that question can be answered with an Integer number
 * - list of answers: number in {min:Integer, max:Integer}
 * - 1 answer is correct
 *
 * MULTIPLE_TUPLES
 * - 1 question
 * - multiple answers: If A,B finite set of words, where f : A -> B, f is a bijection
 *
 * GROUP_ORDER
 * - 1 question, that can be answered by
 *      placing elements of a list (Source-List) in other lists (Destination-List),
 *      where there's 1 Source-List with multiple elements
 *                    1 or more Destination-Lists
 * - 1 answer (grouping of elements) is correct
 *
 * SEQUENCE_ORDER
 * - 1 question, that can be answered by ordering elements in a list
 * - 1 answer (order) is correct
 *
 */
export enum SurveyEntryType {
  SINGLE_CHOICE,
  MULTPLE_CHOICE,
  BINARY_CHOICE,
  MISSING_WORD,
  NUMERICAL_CHOICE,
  MULTIPLE_TUPLES,
  GROUP_ORDER,
  SEQUENCE_ORDER
}

export abstract class SurveyEntry {
  protected constructor(
    public readonly type: SurveyEntryType,
    public description: string = ''
  ) {
  }
}

export abstract class SurveyOption {
  constructor(
    public text: string,
    public isSolution: boolean
  ) {
  }
}

export class SurveyTextOption extends SurveyOption {
  constructor(
    text: string,
    isSolution: boolean
  ) {
    super(text, isSolution);
  }
}

export class SingleChoice extends SurveyEntry {
  constructor() {
    super(SurveyEntryType.SINGLE_CHOICE);
  }
}

export class SurveyStorage {
  constructor(
    public history: Survey[],
    public current: Survey
  ) {
  }
}

/**
 * note:
 *  currently entries will only have 1 element,
 *  that element can only be SINGLE_CHOICE
 */
export class Survey {
  public name: string;
  public desc: string;
  public used: boolean;
  public active: boolean;
  public entries: SurveyEntry[];
}

/**
 * FAIL              = This state can happen, user request is valid but front or backend failed.
 * SUCCESS           = This state can happen, notify user that the action was properly executed.
 * UNREACHABLE_STATE = This state should never happen and should never be reachable by user.
 * ERROR             = This state can happen, lecture, notify and offer alternative options user.
 */
enum SurveyEventType {
  FAIL,
  SUCCESS,
  UNREACHABLE_STATE,
  ERROR
}

class SurveyEvent {

  constructor(
    private type: SurveyEventType,
    private message: string
  ) {
  }

  static of(type: SurveyEventType, message: string): Observable<SurveyEvent> {
    return of(new SurveyEvent(type, message));
  }

}

export class SurveyService {

  constructor(
    private httpClient: HttpClient
  ) {
  }

  /**
   * save changes on server
   *
   * @param survey
   */
  updateSurvey(survey: SurveyStorage): Observable<SurveyEvent> {
    return SurveyEvent.of(SurveyEventType.SUCCESS|SurveyEventType.FAIL, `${survey} has been updatede`);
  }

  /**
   * starts SurveyStorage.current
   *
   * @param survey
   */
  startSurvey(survey: SurveyStorage): Observable<SurveyEvent> {
    if (survey.current.used) {
      return SurveyEvent.of(SurveyEventType.UNREACHABLE_STATE, `${survey} already used`);
    }
    if (survey.current.active) {
      return SurveyEvent.of(SurveyEventType.UNREACHABLE_STATE, `${survey} already active`);
    }
    return SurveyEvent.of(SurveyEventType.SUCCESS|SurveyEventType.FAIL, `${survey} stopped`);
  }

  /**
   * stops SurveyStorage.current
   *
   * @param survey
   */
  stopSurvey(survey: SurveyStorage): Observable<SurveyEvent> {
    if (survey.current.used) {
      return SurveyEvent.of(SurveyEventType.UNREACHABLE_STATE, `${survey} already used`);
    }
    if (!survey.current.active) {
      return SurveyEvent.of(SurveyEventType.UNREACHABLE_STATE, `${survey} not active`);
    }
  }

  /**
   * resets SurveyStorage.current to SurveyStorage.history[index]
   *
   * @param survey
   * @param index
   */
  resetSurvey(survey: SurveyStorage, index: number): Observable<SurveyEvent> {
    if (index < 0 || !survey.history || !survey.history[index]) {
      return SurveyEvent.of(SurveyEventType.UNREACHABLE_STATE, `${survey} out of bound | empty`);
    }
    return SurveyEvent.of(SurveyEventType.SUCCESS|SurveyEventType.FAIL, `${survey} reset survey`);
  }

}
