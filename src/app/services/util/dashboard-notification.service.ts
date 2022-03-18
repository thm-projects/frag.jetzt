import { Injectable } from '@angular/core';
import { NotificationEvent } from '../../models/dashboard-notification';
import { CommentChangeType } from '../../models/comment-change';

@Injectable({
  providedIn: 'root'
})
export class DashboardNotificationService {

  notificationEvents: NotificationEvent[] = [];
  filterList: NotificationEvent[] = [];

  getList(hasFilter: boolean): NotificationEvent[]{
    if(hasFilter){
      return this.filterList;
    }
    return this.notificationEvents;
  }
  getChange(index: number): NotificationEvent {
    if (index < 0 || index >= this.notificationEvents.length) {
      throw new Error('error in getChange(): invalid index argument');
    }
    return this.notificationEvents[index];
  }

  getAllChanges() {
    return this.notificationEvents;
  }

  //Deletes all notifications from the list
  deleteAllChanges() {
    this.notificationEvents.splice(0, this.notificationEvents.length);
  }

  //Deletes one notification from the list
  deleteChange(index: number) {
    if (index < 0 || index >= this.notificationEvents.length) {
      throw new Error('error in deleteChange(): invalid index argument');
    }
    this.notificationEvents.splice(index, 1);
  }

  //filter Notifications
  filterNotifications(filter: CommentChangeType) {
    this.filterList = [];
    if (
      filter !== CommentChangeType.CREATED &&
      filter !== CommentChangeType.DELETED &&
      filter !== CommentChangeType.ANSWERED &&
      filter !== CommentChangeType.CHANGE_ACK &&
      filter !== CommentChangeType.CHANGE_FAVORITE &&
      filter !== CommentChangeType.CHANGE_CORRECT &&
      filter !== CommentChangeType.CHANGE_TAG &&
      filter !== CommentChangeType.CHANGE_SCORE
    ) {
      throw new Error('invalid filter argument');
    }
    this.notificationEvents.forEach((value) => {
      if (value.event === filter) {
        this.filterList.push(value);
      }
    });
  }
}
