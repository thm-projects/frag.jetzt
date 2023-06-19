export class WindowUtils {
  private _port: string;
  private _hostname: string;
  private _protocol: string;
  private _pathname: string;
  private _search: string;
  private _hash: string;
  private _ancestorOrigins: DOMStringList;

  constructor() {
    this._port = '4200';
    this._hostname = 'localhost';
    this._protocol = 'http:';
    this._pathname = '/';
    this._search = '';
    this._hash = '';
  }

  get port() {
    return this._port;
  }

  set port(v: string) {
    this._port = v;
  }

  get hostname() {
    return this._hostname;
  }

  set hostname(v: string) {
    this._hostname = v;
  }

  get protocol() {
    return this._protocol;
  }

  set protocol(v: string) {
    this._protocol = v;
  }

  get ancestorOrigins() {
    return this._ancestorOrigins;
  }

  get pathname() {
    return this._pathname;
  }

  set pathname(v: string) {
    this._pathname = v;
  }

  get search() {
    return this._search;
  }

  set search(v: string) {
    this._search = v;
  }

  get hash() {
    return this._hash;
  }

  set hash(v: string) {
    this._hash = v;
  }

  get host() {
    if (
      (this._protocol === 'http:' && this._port === '80') ||
      (this._protocol == 'https:' && this._port === '443')
    ) {
      return this._hostname;
    }
    return this._hostname + ':' + this._port;
  }

  get origin() {
    return this._protocol + '//' + this.host;
  }

  get href() {
    return this.origin + this._pathname + this._search + this._hash;
  }

  assign(): void {
    this.notSupported();
  }

  replace(): void {
    this.notSupported();
  }

  reload(): void {
    this.notSupported();
  }

  private notSupported() {
    throw new Error('Not supported');
  }

  static getLocation(): Location {
    if (globalThis?.['window']?.['location']) {
      return globalThis.window.location;
    } else {
      return new WindowUtils();
    }
  }
}
