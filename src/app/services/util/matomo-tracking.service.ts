import { effect, inject, Injectable, PLATFORM_ID } from '@angular/core';
import { NavigationEnd, NavigationStart, Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { RoomStateService } from '../state/room-state.service';
import { user } from 'app/user/state/user';
import { EnvironmentType } from 'environments/environment.type';
import { isPlatformBrowser } from '@angular/common';
import { Observable } from 'rxjs';

declare global {
  interface Window {
    _paq: { push: (a: unknown) => void };
  }
}

type MatomoScope = 'page' | 'visit' | 'event' | 'action';

interface MatomoEcommerceItem {
  productSKU: string;
  productName?: string;
  productCategory?: string;
  price?: number;
  quantity?: number;
}

@Injectable({
  providedIn: 'root',
})
export class MatomoTrackingService {
  private lastUrl = '/';
  private lastStartEvent: [string, number] = null;
  private readonly CONFIG = [
    [
      /^\/quiz$/,
      () => {
        this.setDocumentTitle('Quizzing');
      },
    ],
    [
      /^\/(creator|moderator)\/room\/([^/]+)\/moderator\/comments$/,
      (exp: RegExpMatchArray) => {
        this.setDocumentTitle('Moderation page');
        this.setCustomVariable(1, 'VisitorRole', exp[1], 'page');
        this.setCustomVariable(2, 'UserRole', this.getUserRoleString(), 'page');
        this.setCustomVariable(3, 'RoomShortId', exp[2], 'page');
      },
    ],
    [
      /^\/(creator|moderator|participant)\/room\/([^/]+)$/,
      (exp: RegExpMatchArray) => {
        this.setDocumentTitle('Room page');
        this.setCustomVariable(1, 'VisitorRole', exp[1], 'page');
        this.setCustomVariable(2, 'UserRole', this.getUserRoleString(), 'page');
        this.setCustomVariable(3, 'RoomShortId', exp[2], 'page');
      },
    ],
    [
      /^\/(creator|moderator|participant)\/room\/([^/]+)\/comments$/,
      (exp: RegExpMatchArray) => {
        this.setDocumentTitle('Q&A');
        this.setCustomVariable(1, 'VisitorRole', exp[1], 'page');
        this.setCustomVariable(2, 'UserRole', this.getUserRoleString(), 'page');
        this.setCustomVariable(3, 'RoomShortId', exp[2], 'page');
      },
    ],
    [
      /^\/(creator|moderator|participant)\/room\/([^/]+)\/comments\/tagcloud$/,
      (exp: RegExpMatchArray) => {
        this.setDocumentTitle('Keyword word cloud');
        this.setCustomVariable(1, 'VisitorRole', exp[1], 'page');
        this.setCustomVariable(2, 'UserRole', this.getUserRoleString(), 'page');
        this.setCustomVariable(3, 'RoomShortId', exp[2], 'page');
      },
    ],
    [
      /^\/(creator|moderator|participant)\/room\/([^/]+)\/comments\/brainstorming$/,
      (exp: RegExpMatchArray) => {
        this.setDocumentTitle('Brainstorming');
        this.setCustomVariable(1, 'VisitorRole', exp[1], 'page');
        this.setCustomVariable(2, 'UserRole', this.getUserRoleString(), 'page');
        this.setCustomVariable(3, 'RoomShortId', exp[2], 'page');
      },
    ],
    [
      /^\/(creator|moderator|participant)\/room\/([^/]+)\/comments\/questionwall$/,
      (exp: RegExpMatchArray) => {
        this.setDocumentTitle('Question focus');
        this.setCustomVariable(1, 'VisitorRole', exp[1], 'page');
        this.setCustomVariable(2, 'UserRole', this.getUserRoleString(), 'page');
        this.setCustomVariable(3, 'RoomShortId', exp[2], 'page');
      },
    ],
  ] as const;

  private router = inject(Router);
  private roomState = inject(RoomStateService);
  private platform = inject(PLATFORM_ID);

  constructor() {
    if (
      !isPlatformBrowser(this.platform) ||
      !environment.production ||
      !this.initMatomo()
    ) {
      console.info(
        'Matomo will not be activated! isBrowser: %s, isProduction: %s',
        isPlatformBrowser(this.platform),
        environment.production,
      );
      return;
    }
    effect(() => {
      const id = user()?.id;
      if (id) {
        this.setUserId(id);
      } else {
        this.resetUserId();
      }
    });
    this.router.events.subscribe((e) => {
      if (!(e instanceof NavigationEnd)) {
        if (e instanceof NavigationStart) {
          this.lastStartEvent = [e.url, Date.now()];
        }
        return;
      }
      this.onNavigate(e);
    });
  }

  private getUserRoleString(): string {
    return this.roomState.getCurrentRole() ?? 'N/A';
  }

  private onNavigate(end: NavigationEnd) {
    const endTime = Date.now();
    const url = decodeURI(this.router.url);
    let matched = false;
    for (const [key, operation] of this.CONFIG) {
      const match = url.match(key);
      if (match) {
        matched = true;
        this.setReferrerUrl(this.lastUrl);
        this.lastUrl = url;
        this.setCustomUrl(url);
        this.deleteCustomVariables('page');
        if (this.lastStartEvent?.[0] && this.lastStartEvent[0] === end.url) {
          this.setGenerationTimeMs(endTime - this.lastStartEvent[1]);
        }
        operation(match);
        this.trackPageView();
        break;
      }
    }
    if (!matched) {
      console.warn('Route not found', url);
    }
    this.lastUrl = url;
    const env: EnvironmentType = environment;
    if (env.matomo.trackLinks === true) {
      this.enableLinkTracking(Boolean(env.matomo.trackLinkValue));
    }
  }

  // https://developer.matomo.org/guides/content-tracking
  // https://developer.matomo.org/guides/tracking-javascript-guide
  setDocumentTitle(title: string) {
    this.push(['setDocumentTitle', title]);
  }

  setDomains(domains: string[]) {
    this.push(['setDomains', domains]);
  }

  setCustomDimension(dimensionId: number, dimensionValue: string) {
    this.push(['setCustomDimension', dimensionId, dimensionValue]);
  }

  deleteCustomDimension(dimensionId: number) {
    this.push(['deleteCustomDimension', dimensionId]);
  }

  getCustomDimension(dimensionId: number): Observable<string> {
    return this.get<string>((t) => t['getCustomDimension'](dimensionId));
  }

  /**
   * @deprecated Use `setCustomDimension` instead, can only be used with a plugin
   */
  setCustomVariable(
    slot: number,
    name: string,
    value: string,
    scope: MatomoScope,
  ) {
    this.push(['setCustomVariable', slot, name, value, scope]);
  }

  /**
   * @deprecated
   */
  deleteCustomVariable(slot: number, scope: MatomoScope) {
    this.push(['deleteCustomVariable', slot, scope]);
  }

  /**
   * @deprecated
   */
  deleteCustomVariables(scope: MatomoScope) {
    this.push(['deleteCustomVariables', scope]);
  }

  /**
   * @deprecated
   */
  getCustomVariable(slot: number, scope: MatomoScope): Observable<string> {
    return this.get<string>((t) => t['getCustomVariable'](slot, scope));
  }

  /**
   * @deprecated
   */
  storeCustomVariablesInCookie() {
    this.push(['storeCustomVariablesInCookie']);
  }

  setReferrerUrl(url: string) {
    this.push(['setReferrerUrl', url]);
  }

  setCustomUrl(url: string) {
    this.push(['setCustomUrl', url]);
  }

  setSiteId(siteId: number) {
    this.push(['setSiteId', siteId]);
  }

  setApiUrl(url: string) {
    this.push(['setApiUrl', url]);
  }

  trackPageView(customTitle?: string) {
    this.push(customTitle ? ['trackPageView', customTitle] : ['trackPageView']);
  }

  trackEvent(category: string, action: string, name?: string, value?: number) {
    const arr: unknown[] = ['trackEvent', category, action];
    if (name) {
      arr.push(name);
      if (typeof value === 'number') {
        arr.push(value);
      }
    }
    this.push(arr);
  }

  trackSiteSearch(keyword: string, category?: string, resultsCount?: number) {
    const arr: unknown[] = ['trackSiteSearch', keyword];
    if (category) {
      arr.push(category);
      if (typeof resultsCount === 'number') {
        arr.push(resultsCount);
      }
    }
    this.push(arr);
  }

  trackGoal(idGoal: number, customGoalPoints?: number) {
    const arr: unknown[] = ['trackGoal', idGoal];
    if (typeof customGoalPoints === 'number') {
      arr.push(customGoalPoints);
    }
    this.push(arr);
  }

  trackLink(url: string, linkType: 'link' | 'download') {
    this.push(['trackLink', url, linkType]);
  }

  trackAllContentImpressions() {
    this.push(['trackAllContentImpressions']);
  }

  trackVisibleContentImpressions(checkOnScroll: boolean, timeInterval: number) {
    this.push(['trackVisibleContentImpressions', checkOnScroll, timeInterval]);
  }

  trackContentImpressionsWithinNode(node: Node) {
    this.push(['trackContentImpressionsWithinNode', node]);
  }

  trackContentInteractionNode(node: Node, contentInteraction: string) {
    this.push(['trackContentInteractionNode', node, contentInteraction]);
  }

  trackContentImpression(
    contentName: string,
    contentPiece: string,
    contentTarget: string,
  ) {
    this.push([
      'trackContentImpression',
      contentName,
      contentPiece,
      contentTarget,
    ]);
  }

  trackContentInteraction(
    contentInteraction: string,
    contentName: string,
    contentPiece: string,
    contentTarget: string,
  ) {
    this.push([
      'trackContentInteraction',
      contentInteraction,
      contentName,
      contentPiece,
      contentTarget,
    ]);
  }

  logAllContentBlocksOnPage() {
    this.push(['logAllContentBlocksOnPage']);
  }

  ping() {
    this.push(['ping']);
  }

  enableHeartBeatTimer(delay: number) {
    this.push(['enableHeartBeatTimer', delay]);
  }

  enableLinkTracking(enable: boolean) {
    this.push(['enableLinkTracking', enable]);
  }

  enableCrossDomainLinking() {
    this.push(['enableCrossDomainLinking']);
  }

  setCrossDomainLinkingTimeout(timeout: number) {
    this.push(['setCrossDomainLinkingTimeout', timeout]);
  }

  getCrossDomainLinkingUrlParameter(): Observable<string> {
    return this.get<string>((t) => t['getCrossDomainLinkingUrlParameter']());
  }

  setUserId(userId: string) {
    this.push(['setUserId', userId]);
  }

  resetUserId() {
    this.push(['resetUserId']);
  }

  setTrackerUrl(url: string) {
    this.push(['setTrackerUrl', url]);
  }

  getMatomoUrl(): Observable<string> {
    return this.get<string>((t) => t['getPiwikUrl']());
  }

  getCurrentUrl(): Observable<string> {
    return this.get<string>((t) => t['getCurrentUrl']());
  }

  setDownloadClasses(classes: string | string[]) {
    this.push(['setDownloadClasses', classes]);
  }

  setDownloadExtensions(extensions: string | string[]) {
    if (typeof extensions === 'string') {
      extensions = [extensions];
    }
    this.push(['setDownloadExtensions', extensions.join('|')]);
  }

  addDownloadExtensions(extensions: string | string[]) {
    if (typeof extensions === 'string') {
      extensions = [extensions];
    }
    this.push(['addDownloadExtensions', extensions.join('|')]);
  }

  removeDownloadExtensions(extensions: string | string[]) {
    if (typeof extensions === 'string') {
      extensions = [extensions];
    }
    this.push(['removeDownloadExtensions', extensions.join('|')]);
  }

  setIgnoreClasses(classes: string | string[]) {
    if (typeof classes === 'string') {
      classes = [classes];
    }
    this.push(['setIgnoreClasses', classes.join('|')]);
  }

  setLinkClasses(classes: string | string[]) {
    if (typeof classes === 'string') {
      classes = [classes];
    }
    this.push(['setLinkClasses', classes.join('|')]);
  }

  setLinkTrackingTimer(delay: number) {
    this.push(['setLinkTrackingTimer', delay]);
  }

  getLinkTrackingTimer(): Observable<number> {
    return this.get<number>((t) => t['getLinkTrackingTimer']());
  }

  discardHashTag(value: boolean) {
    this.push(['discardHashTag', value]);
  }

  setGenerationTimeMs(time: number) {
    this.push(['setGenerationTimeMs', time]);
  }

  appendToTrackingUrl(appendToUrl: string) {
    this.push(['appendToTrackingUrl', appendToUrl]);
  }

  killFrame() {
    this.push(['killFrame']);
  }

  redirectFile(url: string) {
    this.push(['redirectFile', url]);
  }

  setHeartBeatTimer(minimumVisitLength: number, heartBeatDelay: number) {
    this.push(['setHeartBeatTimer', minimumVisitLength, heartBeatDelay]);
  }

  getVisitorId(): Observable<string> {
    return this.get<string>((t) => t['getVisitorId']());
  }

  getVisitorInfo(): Observable<unknown[]> {
    return this.get<unknown[]>((t) => t['getVisitorInfo']());
  }

  getAttributionInfo(): Observable<unknown[]> {
    return this.get<unknown[]>((t) => t['getAttributionInfo']());
  }

  getAttributionCampaignName(): Observable<string> {
    return this.get<string>((t) => t['getAttributionCampaignName']());
  }

  getAttributionCampaignKeyword(): Observable<string> {
    return this.get<string>((t) => t['getAttributionCampaignKeyword']());
  }

  getAttributionReferrerTimestamp(): Observable<string> {
    return this.get<string>((t) => t['getAttributionReferrerTimestamp']());
  }

  getAttributionReferrerUrl(): Observable<string> {
    return this.get<string>((t) => t['getAttributionReferrerUrl']());
  }

  getUserId(): Observable<string> {
    return this.get<string>((t) => t['getUserId']());
  }

  setCampaignNameKey(name: string) {
    this.push(['setCampaignNameKey', name]);
  }

  setCampaignKeywordKey(keyword: string) {
    this.push(['setCampaignKeywordKey', keyword]);
  }

  setConversionAttributionFirstReferrer(conversionToFirstReferrer: boolean) {
    this.push([
      'setConversionAttributionFirstReferrer',
      conversionToFirstReferrer,
    ]);
  }

  setEcommerceView(
    productSKU: string,
    productName: string,
    productCategory: string,
    price: number,
  ) {
    this.push([
      'setEcommerceView',
      productSKU,
      productName,
      productCategory,
      price,
    ]);
  }

  addEcommerceItem(
    productSKU: string,
    productName?: string,
    productCategory?: string,
    price?: number,
    quantity?: number,
  ) {
    const arr: unknown[] = ['addEcommerceItem', productSKU];
    if (productName) {
      arr.push(productName);
      if (productCategory) {
        arr.push(productCategory);
        if (typeof price === 'number') {
          arr.push(price);
          if (typeof quantity === 'number') {
            arr.push(quantity);
          }
        }
      }
    }
    this.push(arr);
  }

  removeEcommerceItem(productSKU: string) {
    this.push(['removeEcommerceItem', productSKU]);
  }

  clearEcommerceCart() {
    this.push(['clearEcommerceCart']);
  }

  getEcommerceItems(): Observable<MatomoEcommerceItem[]> {
    return this.get((t) => t['getEcommerceItems']());
  }

  trackEcommerceCartUpdate(grandTotal: number) {
    this.push(['trackEcommerceCartUpdate', grandTotal]);
  }

  trackEcommerceOrder(
    orderId: string,
    grandTotal: number,
    subTotal?: number,
    tax?: number,
    shipping?: number,
    discount?: number | boolean,
  ) {
    const arr: unknown[] = ['trackEcommerceOrder', orderId, grandTotal];
    if (typeof subTotal === 'number') {
      arr.push(subTotal);
      if (typeof tax === 'number') {
        arr.push(tax);
        if (typeof shipping === 'number') {
          arr.push(shipping);
          if (typeof discount === 'number' || typeof discount === 'boolean') {
            arr.push(discount);
          }
        }
      }
    }
    this.push(arr);
  }

  requireConsent() {
    this.push(['requireConsent']);
  }

  setConsentGiven() {
    this.push(['setConsentGiven']);
  }

  rememberConsentGiven(hoursToExpire?: number) {
    const arr: unknown[] = ['rememberConsentGiven'];
    if (typeof hoursToExpire === 'number') {
      arr.push(hoursToExpire);
    }
    this.push(arr);
  }

  forgetConsentGiven() {
    this.push(['forgetConsentGiven']);
  }

  requireCookieConsent() {
    this.push(['requireCookieConsent']);
  }

  setCookieConsentGiven() {
    this.push(['setCookieConsentGiven']);
  }

  rememberCookieConsentGiven(hoursToExpire?: number) {
    const arr: unknown[] = ['rememberCookieConsentGiven'];
    if (typeof hoursToExpire === 'number') {
      arr.push(hoursToExpire);
    }
    this.push(arr);
  }

  forgetCookieConsentGiven() {
    this.push(['forgetCookieConsentGiven']);
  }

  setDoNotTrack(doNotTrack: boolean) {
    this.push(['setDoNotTrack', doNotTrack]);
  }

  disableCookies() {
    this.push(['disableCookies']);
  }

  deleteCookies() {
    this.push(['deleteCookies']);
  }

  hasCookies(): Observable<boolean> {
    return this.get<boolean>((t) => t['hasCookies']());
  }

  setCookieNamePrefix(prefix: string) {
    this.push(['setCookieNamePrefix', prefix]);
  }

  setCookieDomain(domain: string) {
    this.push(['setCookieDomain', domain]);
  }

  setCookiePath(path: string) {
    this.push(['setCookiePath', path]);
  }

  setSecureCookie(secure: boolean) {
    this.push(['setSecureCookie', secure]);
  }

  setVisitorCookieTimeout(timeout: number) {
    this.push(['setVisitorCookieTimeout', timeout]);
  }

  setReferralCookieTimeout(timeout: number) {
    this.push(['setReferralCookieTimeout', timeout]);
  }

  setSessionCookieTimeout(timeout: number) {
    this.push(['setSessionCookieTimeout', timeout]);
  }

  addListener(element: Element) {
    this.push(['addListener', element]);
  }

  setRequestMethod(method: 'GET' | 'POST' = 'GET') {
    this.push(['setRequestMethod', method]);
  }

  setCustomRequestProcessing(callback: (queryParameters: string) => void) {
    this.push(['setCustomRequestProcessing', callback]);
  }

  setRequestContentType(contentType: string) {
    this.push(['setRequestContentType', contentType]);
  }

  disableQueueRequest() {
    this.push(['disableQueueRequest']);
  }

  private push(value: Array<unknown>) {
    if (!('_paq' in globalThis)) {
      console.warn(
        'Tried to write to piwik, but it is currently not available (yet).',
      );
      return;
    }
    globalThis._paq.push(value);
  }

  private get<T>(func: (thiz: unknown) => T): Observable<T> {
    return new Observable((subscriber) => {
      this.push([
        function (this: unknown) {
          subscriber.next(func(this));
          subscriber.complete();
        },
      ]);
    });
  }

  private initMatomo(): boolean {
    const env = environment as EnvironmentType;
    if (!env.matomo?.scriptUrl) return false;
    if (!('_paq' in globalThis)) {
      globalThis._paq = [];
    }
    if (env.matomo.requireConsent === 'consent') {
      this.requireConsent();
    } else if (env.matomo.requireConsent === 'cookie-consent') {
      this.requireCookieConsent();
    }
    if (!env.matomo.skipTrackingInitialPageView) {
      this.trackPageView();
      const isUsingRouteTracking = true;
      if (env.matomo.trackLinks && !isUsingRouteTracking) {
        setTimeout(() => {
          this.enableLinkTracking(Boolean(env.matomo.trackLinkValue));
        });
      }
    }
    if (env.matomo.trackers?.length) {
      env.matomo.trackers.forEach((tracker, i) => {
        if (i === 0) {
          this.setTrackerUrl(tracker.trackerUrl);
          this.setSiteId(tracker.siteId);
        } else {
          this.push(['addTracker', tracker.trackerUrl, String(tracker.siteId)]);
        }
      });
    }
    // add script
    const script = document.createElement('script');
    script.src = env.matomo.scriptUrl;
    script.type = 'text/javascript';
    script.defer = true;
    script.async = true;
    document.body.appendChild(script);
    return true;
  }
}
