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

export enum Period {
    FROMNOW    = 'from-now',
    ONEHOUR    = 'time-1h',
    THREEHOURS = 'time-3h',
    ONEDAY     = 'time-1d',
    ONEWEEK    = 'time-1w',
    TWOWEEKS   = 'time-2w',
    ALL        = 'time-all'
}

export class CommentFilter {
    filterSelected : string = '';
    keywordSelected : string = '';
    tagSelected : string = '';

    paused: boolean = false;
    timeStampUntil : number = 0;

    periodSet : Period = Period.TWOWEEKS;
    timeStampNow : number = 0;

    constructor(obj?: any) {
        if (obj) {
            this.filterSelected = obj.filterSelected;
            this.keywordSelected = obj.keywordSelected;
            this.tagSelected = obj.tagSelected;
            this.paused = obj.paused;
            this.timeStampUntil = obj.timeStampUntil;
            this.periodSet = obj.periodSet;
            this.timeStampNow = obj.timeStampNow;
        }
    }

    public static set currentFilter(filter : CommentFilter) {
        localStorage.setItem("filter", JSON.stringify(filter));
    }

    public static get currentFilter() : CommentFilter {
        return new CommentFilter(JSON.parse(localStorage.getItem("filter")));
    }

    public static writeStdFilter() {
        this.currentFilter = new CommentFilter();
    }
    
    public static generateFilterNow(filterSelected : string) : CommentFilter {
        let filter = new CommentFilter();
        
        filter.filterSelected = filterSelected;
        filter.paused = false;

        filter.tagSelected = '';
        filter.keywordSelected = '';

        filter.periodSet = Period.FROMNOW;
        filter.timeStampNow = new Date().getTime();

        return filter;
    }

    public static generateFilterUntil(filterSelected : string, periodSelected : Period, untilTime : number, tagSelected : string, keywordSelected : string) : CommentFilter {
        let filter = new CommentFilter();
        
        filter.filterSelected = filterSelected;

        filter.paused = true;
        filter.timeStampUntil = untilTime;

        filter.tagSelected = tagSelected;
        filter.keywordSelected = keywordSelected;
        
        filter.periodSet = periodSelected;

        return filter;
    }
}