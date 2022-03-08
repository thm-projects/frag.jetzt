import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';
import { IAppConfig } from './models/app-config.model';
import {lastValueFrom} from 'rxjs';
@Injectable()
export class AppConfig {
    static settings: IAppConfig;
    constructor(private http: HttpClient) {}
    load() {
        const jsonFile = `assets/config/config.${environment.name}.json`;
        return new Promise<void>((resolve, reject) => {
          lastValueFrom(this.http.get(jsonFile)).then((response: IAppConfig) => {
            AppConfig.settings = response;
            resolve();
          }).catch((response: any) => {
            reject(`Could not load file '${jsonFile}': ${JSON.stringify(response)}`);
          });
        });
    }
}
