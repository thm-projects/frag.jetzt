import { Period } from '../components/shared/comment-list/comment-list.component';
import { Comment } from '../models/comment';
import { CorrectWrong } from '../models/correct-wrong.enum';

export class CommentFilterUtils {
    
    private static checkPeriod(com : Comment) : boolean {
        /* Get Filter Options */
        const period = JSON.parse(localStorage.getItem('currentPeriod'));
        const timestamp = JSON.parse(localStorage.getItem('currentFromNowTimestamp')); 

        /* Filter by Period */
        const currentTime = new Date();
        const hourInSeconds = 3600000;
        let periodInSeconds;

        if (period !== Period.ALL) {
            switch (period) {
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
        }

        const commentTime = new Date(com.timestamp).getTime();
        const filterTime = (period === Period.FROMNOW ? timestamp : (currentTime.getTime() - periodInSeconds));
        
        return (commentTime < filterTime);
    }

    private static checkFilters(com : Comment) : boolean {
        /* Get Filter Options */
        const currentFilters = JSON.parse(localStorage.getItem('currentFilters'));

        const read = 'read';
        const unread = 'unread';
        const favorite = 'favorite';
        const correct = 'correct';
        const wrong = 'wrong';
        const bookmark = 'bookmark';
        const answer = 'answer';
        const unanswered = 'unanswered';

        if (currentFilters) {  // no filters => return true
            switch (currentFilters) {
              case correct:
                return com.correct === CorrectWrong.CORRECT ? true : false;
              case wrong:
                return com.correct === CorrectWrong.WRONG ? true : false;
              case favorite:
                return com.favorite;
              case bookmark:
                return com.bookmark;
              case read:
                return com.read;
              case unread:
                return !com.read;
              case answer:
                return com.answer != "";
              case unanswered:
                return !com.answer;
            }
        }

        return true;        
    }

    public static checkComment(com : Comment) : boolean {
        return (this.checkPeriod(com) && this.checkFilters(com));
    }

}