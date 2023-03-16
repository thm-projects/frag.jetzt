import { Injectable } from '@angular/core';
import { UserManagementService } from '../util/user-management.service';
import { User } from '../../models/user';
import { NgxIndexedDBService } from 'ngx-indexed-db';
import { ConfigurationService } from '../util/configuration.service';
import { TranslateService } from '@ngx-translate/core';
import { NotificationService } from '../util/notification.service';
import { generateConsequentlyUUID } from '../../utils/test-utils';
import { UserRole } from '../../models/user-roles.enum';
import { AuthenticationServiceMock } from './authentication.service.mock';
import { LoginResult, LoginResultArray } from '../http/authentication.service';

@Injectable({
  providedIn: 'root',
})
export class UserManagementServiceMock extends UserManagementService {
  constructor(
    private indexddb: NgxIndexedDBService,
    private config: ConfigurationService,
    private trans: TranslateService,
    private not: NotificationService,
    private auth: AuthenticationServiceMock,
  ) {
    super(auth, indexddb, config, trans, not, null, null, null, null, null);
    this.setInitialized();
    const user = new User({
      id: generateConsequentlyUUID(),
      loginId: 'test@test.de',
      type: 'registered',
      role: UserRole.PARTICIPANT,
      isGuest: false,
    });
    this._guestUser = new User({
      id: generateConsequentlyUUID(),
      type: 'guest',
      role: UserRole.PARTICIPANT,
      isGuest: true,
    });
    this.onReceive(user, [
      LoginResult.Success,
      user,
    ] as LoginResultArray).subscribe();
  }
}
