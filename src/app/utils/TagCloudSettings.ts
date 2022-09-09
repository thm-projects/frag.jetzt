import { Room } from '../models/room';
import { TopicCloudAdminData } from '../components/shared/_dialogs/topic-cloud-administration/TopicCloudAdminData';
import { TopicCloudAdminService } from '../services/util/topic-cloud-admin.service';

const CURRENT_VERSION = 1;

export class TagCloudSettings {

  constructor(
    public adminData: TopicCloudAdminData,
  ) {
  }

  static getFromRoom(room: Room): TagCloudSettings {
    const object = JSON.parse(room.tagCloudSettings || null);
    if (!object) {
      return null;
    }
    if ((object.version || 0) !== CURRENT_VERSION) {
      room.tagCloudSettings = null;
      return null;
    }
    const { admin } = object;
    return new TagCloudSettings(admin as TopicCloudAdminData);
  }

  static getCurrent(): TagCloudSettings {
    return new TagCloudSettings(TopicCloudAdminService.getDefaultAdminData);
  }

  serialize() {
    return JSON.stringify({
      version: CURRENT_VERSION,
      admin: this.adminData
    });
  }
}
