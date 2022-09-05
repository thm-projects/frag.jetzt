import {Survey} from './survey';

export class SurveyStorage {
  constructor(
    public history: Survey[],
    public current: Survey
  ) {
  }
}
