import { FilteredDataAccess } from '../../../../utils/filtered-data-access';
import {
  FilterType,
  Period,
  PeriodKey,
  SortType,
} from '../../../../utils/data-filter-object.lib';
import { Comment } from '../../../../models/comment';

export interface CommentListSupport {
  readonly hasFilter: boolean;

  filterUserByNumber(user: string): void;

  filterTag(tag: string): void;

  sortTime(reverse?: boolean): void;

  sortControversy(reverse?: boolean): void;

  sort(sortType: SortType, reverse?: boolean): void;

  setTimePeriod(period: PeriodKey): void;

  deactivateFilter(): void;

  sortScore(reverse?: boolean): void;

  filterFavorites(): void;

  filterUser(comment: Comment): void;

  filterBookmark(): void;

  readonly filteredDataAccess: FilteredDataAccess;
}

export function createCommentListSupport(
  filteredDataAccess: FilteredDataAccess,
): CommentListSupport {
  return {
    get filteredDataAccess() {
      return filteredDataAccess;
    },
    sort(sortType: SortType, reverse: boolean = false) {
      const filter = filteredDataAccess.dataFilter;
      filter.sortType = sortType;
      filter.sortReverse = reverse;
      filteredDataAccess.dataFilter = filter;
    },
    sortScore(reverse: boolean = false) {
      this.sort(SortType.Score, reverse);
    },
    sortTime(reverse: boolean = false) {
      this.sort(SortType.Time, reverse);
    },
    sortControversy(reverse: boolean = false) {
      this.sort(SortType.Controversy, reverse);
    },
    filterFavorites() {
      this.filterIcon = 'grade';
      this.isSvgIcon = false;
      this.filterTitle = 'question-wall.filter-favorite';
      this.filterDesc = '';
      const filter = this._filterObj.dataFilter;
      filter.filterCompare = null;
      filter.filterType = FilterType.Favorite;
      this._filterObj.dataFilter = filter;
    },
    filterUserByNumber(user: string) {
      this.filterIcon = 'person_pin_circle';
      this.isSvgIcon = false;
      this.filterTitle = 'question-wall.filter-user';
      this.filterDesc = '';
      const filter = this._filterObj.dataFilter;
      filter.filterCompare = user;
      filter.filterType = FilterType.CreatorId;
      this._filterObj.dataFilter = filter;
    },
    filterUser(comment: Comment) {
      this.filterUserByNumber(comment.creatorId);
    },
    filterBookmark() {
      this.filterIcon = 'bookmark';
      this.isSvgIcon = false;
      this.filterTitle = 'question-wall.filter-bookmark';
      this.filterDesc = '';
      const filter = this._filterObj.dataFilter;
      filter.filterCompare = null;
      filter.filterType = FilterType.Bookmark;
      this._filterObj.dataFilter = filter;
    },
    filterTag(tag: string) {
      this.filterIcon = 'sell';
      this.isSvgIcon = false;
      this.filterTitle = '';
      this.filterDesc = tag;
      const filter = this._filterObj.dataFilter;
      filter.filterCompare = tag;
      filter.filterType = FilterType.Tag;
      this._filterObj.dataFilter = filter;
    },
    deactivateFilter() {
      const filter = this._filterObj.dataFilter;
      filter.filterType = null;
      filter.filterCompare = null;
      this._filterObj.dataFilter = filter;
    },
    setTimePeriod(period: PeriodKey) {
      const filter = this._filterObj.dataFilter;
      filter.period = Period[period];
      filter.timeFilterStart = Date.now();
      this._filterObj.dataFilter = filter;
    },
    get hasFilter() {
      return Boolean(this._filterObj.dataFilter.filterType);
    },
  };
}
