export class ContentGroup {
  name: string;
  contentIds: string[];
  autoSort: boolean;

  constructor(name: string, contentIds: string[], autoSort: boolean) {
    this.name = name;
    this.contentIds = contentIds;
    this.autoSort = autoSort;
  }
}
