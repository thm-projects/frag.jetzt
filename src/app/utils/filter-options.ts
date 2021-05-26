import { Period } from "../components/shared/comment-list/comment-list.component";
import { CommentFilterUtils } from "./filter-comments";

export const enum FilterNames {
    read = 'read',
    unread = 'unread',
    favorite = 'favorite',
    correct = 'correct',
    wrong = 'wrong',
    bookmark = 'bookmark',
    answer = 'answer',
    unanswered = 'unanswered'
};

export class CommentFilterOptions {
    filterSelected : string;
    keywordSelected : string;
    tagSelected : string;

    paused: boolean;
    timeStampUntil : number;

    periodSet : Period;
    timeStampNow : number;

    constructor() {
        this.filterSelected = '';
        this.keywordSelected = '';
        this.tagSelected = '';
        this.paused = false;
        this.periodSet = Period.ALL;
    }

    public writeFilter() {
        localStorage.setItem("filter", JSON.stringify(this));
    }


    public static writeFilterStatic(filter : CommentFilterOptions) {
        localStorage.setItem("filter", JSON.stringify(filter));
    }

    public static readFilter() : CommentFilterOptions {
        return JSON.parse(localStorage.getItem("filter"));
    }
    
    public static generateFilterNow(filterSelected : string) : CommentFilterOptions {
        let filter = new CommentFilterOptions();
        
        filter.filterSelected = filterSelected;
        filter.paused = false;

        filter.tagSelected = '';
        filter.keywordSelected = '';

        filter.periodSet = Period.FROMNOW;
        filter.timeStampNow = new Date().getTime();

        return filter;
    }

    public static generateFilterUntil(filterSelected : string, periodSelected : Period, untilTime : number, tagSelected : string, keywordSelected : string) : CommentFilterOptions {
        let filter = new CommentFilterOptions();
        
        filter.filterSelected = filterSelected;

        filter.paused = true;
        filter.timeStampUntil = untilTime;

        filter.tagSelected = tagSelected;
        filter.keywordSelected = keywordSelected;
        
        filter.periodSet = periodSelected;

        return filter;
    }

}