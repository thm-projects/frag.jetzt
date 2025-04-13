import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class PrivacyConsentService {
  private readonly STORAGE_KEY = 'privacy_policy_accepted';

  constructor() {}

  acceptPrivacyPolicy(): void {
    localStorage.setItem(this.STORAGE_KEY, 'true');
  }

  rejectPrivacyPolicy(): void {
    localStorage.setItem(this.STORAGE_KEY, 'false');
  }

  hasAcceptedPrivacyPolicy(): boolean {
    return localStorage.getItem(this.STORAGE_KEY) === 'true';
  }
}
