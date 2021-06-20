import { Comment } from '../models/comment';
import { CorrectWrong } from '../models/correct-wrong.enum';
import { CommentFilter, FilterNames, Period } from './filter-options';

export class CommentFilterUtils {
    
    private static checkPeriod(com : Comment, filter : CommentFilter) : boolean {
        /* Filter by Period */
        const currentTime = new Date();
        const hourInSeconds = 3600000;
        let periodInSeconds;

        if(filter.periodSet === Period.ALL) {
          return true;
        }

        switch (filter.periodSet) {
            case Period.FROMNOW:
              break;
            case Period.ONEHOUR:
              periodInSeconds = hourInSeconds;
              break;
            case Period.THREEHOURS:
              periodInSeconds = hourInSeconds * 3;
              break;
            case Period.ONEDAY:
              periodInSeconds = hourInSeconds * 24;
              break;
            case Period.ONEWEEK:
              periodInSeconds = hourInSeconds * 168;
              break;
            case Period.TWOWEEKS:
              periodInSeconds = hourInSeconds * 336;
              break;
        }
        
        const commentTime = new Date(com.timestamp).getTime();

        if (filter.periodSet === Period.FROMNOW) {
          return commentTime > filter.timeStampNow;
        }
        
        if (filter.paused) {
          return commentTime < filter.timeStampUntil;
        }

        return commentTime > (currentTime.getTime() - periodInSeconds);
    }

    private static checkFilters(com : Comment, filter : CommentFilter) : boolean {
        if (filter.filterSelected) {  // no filters => return true
            switch (filter.filterSelected) {
              case FilterNames.correct:
                return com.correct === CorrectWrong.CORRECT ? true : false;
              case FilterNames.wrong:
                return com.correct === CorrectWrong.WRONG ? true : false;
              case FilterNames.favorite:
                return com.favorite;
              case FilterNames.bookmark:
                return com.bookmark;
              case FilterNames.read:
                return com.read;
              case FilterNames.unread:
                return !com.read;
              case FilterNames.answer:
                return com.answer != "";
              case FilterNames.unanswered:
                return !com.answer;
            }
        }

        if (filter.keywordSelected != '') {
          return com.keywordsFromQuestioner.includes(filter.keywordSelected);
        }
        if (filter.tagSelected != ''){
          return com.tag === filter.tagSelected;
        }

        return true;        
    }
    
    public static checkComment(com : Comment, filter : CommentFilter = CommentFilter.currentFilter) : boolean {
      return (this.checkPeriod(com, filter) && this.checkFilters(com, filter));
    }
}