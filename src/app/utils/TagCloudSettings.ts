import { Room } from '../models/room';
import { CloudParameters } from './cloud-parameters';
import { TopicCloudAdminData } from '../components/shared/_dialogs/topic-cloud-administration/TopicCloudAdminData';
import { TopicCloudAdminService } from '../services/util/topic-cloud-admin.service';
import {
  BrainstormingSettings
} from '../components/shared/_dialogs/topic-cloud-brainstorming/topic-cloud-brainstorming.component';

const CURRENT_VERSION = 1;

export class TagCloudSettings {

  constructor(
    public adminData: TopicCloudAdminData,
    public settings: CloudParameters,
    public brainstorming: BrainstormingSettings,
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
    const { admin, cloud, brainstorming } = object;
    return new TagCloudSettings(admin as TopicCloudAdminData, new CloudParameters(cloud), brainstorming);
  }

  static getDefault(brainstorming?: BrainstormingSettings): TagCloudSettings {
    return new TagCloudSettings(TopicCloudAdminService.getDefaultAdminData,
      CloudParameters.currentParameters, brainstorming);
  }

  static getDefaultByRoom(room: Room): TagCloudSettings {
    return this.getDefault(JSON.parse(room.tagCloudSettings || null)?.brainstorming);
  }

  applyToRoom(room: Room) {
    const obj: any = {
      version: CURRENT_VERSION,
      admin: this.adminData,
      cloud: this.settings
    };
    if (this.brainstorming) {
      obj.brainstorming = this.brainstorming;
    }
    room.tagCloudSettings = JSON.stringify(obj);
  }
}
