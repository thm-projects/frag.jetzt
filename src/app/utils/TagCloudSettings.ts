import { Room } from '../models/room';
import { TopicCloudAdminData } from '../components/shared/_dialogs/topic-cloud-administration/TopicCloudAdminData';
import { TopicCloudAdminService } from '../services/util/topic-cloud-admin.service';

const CURRENT_VERSION = 2;

export class TagCloudSettings {
  constructor(public adminData: TopicCloudAdminData) {}

  static getFromRoom(room: Room): TagCloudSettings {
    let object = JSON.parse(room.tagCloudSettings || null);
    if (!object) {
      return null;
    }
    let version = object.version || 0;
    if (version === 0) {
      return null;
    }
    while (version < CURRENT_VERSION) {
      object = this.migrate(object, version);
      version += 1;
    }
    const { admin } = object;
    return new TagCloudSettings(admin as TopicCloudAdminData);
  }

  static getCurrent(): TagCloudSettings {
    return new TagCloudSettings(TopicCloudAdminService.getDefaultAdminData);
  }

  private static migrate(object: unknown, currentVersion: number): unknown {
    switch (currentVersion) {
      case 1:
        return {
          admin: object['admin'],
          version: 2,
        };
    }
    return null;
  }

  serialize() {
    return JSON.stringify({
      version: CURRENT_VERSION,
      admin: this.adminData,
    });
  }
}
