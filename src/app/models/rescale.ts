import { KeyboardUtils } from '../utils/keyboard';
import { KeyboardKey } from '../utils/keyboard/keys';

export class Rescale {

  private static isFullscreen: boolean;
  private static isRescaleFullscreen: boolean;

  public scale = 1;
  public cachedScale = 1;
  private f;
  public defaultScale = 1;

  private state = 0;

  public static requestFullscreen() {
    if (Rescale.isFullscreen) {return; }
    Rescale.isFullscreen = true;
    document.body.requestFullscreen();
  }

  public static exitFullscreen() {
    if (!Rescale.isFullscreen) {return; }
    if (Rescale.isRescaleFullscreen) {return; }
    Rescale.isFullscreen = false;
    document.exitFullscreen();
  }

  private static requestFullscreenByRescale() {
    Rescale.requestFullscreen();
    Rescale.isRescaleFullscreen = true;
  }

  private static exitFullscreenByRescale() {
    Rescale.isRescaleFullscreen = false;
    Rescale.exitFullscreen();
  }

  public setDefaultScale(defaultScale: number) {
    this.scale = defaultScale;
    this.defaultScale = defaultScale;
    this.scaleUpdate();
  }

  public scaleUp() {
    this.setScale(this.scale + 0.1);
  }

  public scaleDown() {
    this.setScale(this.scale - 0.1);
  }

  public scaleUndo() {
    this.setScale(this.defaultScale);
  }

  public setScale(scale: number) {
    this.scale = scale;
    if (this.scale < 0.1) {
      this.scale = 0.1;
    } else if (this.scale > 2) {
      this.scale = 2;
    }
    this.scaleUpdate();
  }

  public setInitialScale(scale: number) {
    this.cachedScale = scale;
  }

  private scaleUpdate() {
    document.getElementById('rescale_screen').style.zoom = this.scale + '';
  }

  public toggleState() {
    this.state++;
    if (this.state >= 2) {
      this.state = 0;
    }
    this.updateState();
  }

  public updateState() {
    switch (this.state) {
      case 0:
        Rescale.exitFullscreenByRescale();
        setTimeout(() => {
          this.toggleRescaler(false);
        }, 200);
        setTimeout(() => {
          this.toggleHeader(true);
          this.toggleFooter(true);
        }, 600);
      break;
      case 1:
        Rescale.requestFullscreenByRescale();
        setTimeout(() => {
          this.toggleHeader(false);
          this.toggleFooter(false);
        }, 200);
        setTimeout(() => {
          this.toggleRescaler(true);
        }, 600);
      break;
      default: console.error('updateState, this should not happen.'); break;
    }
  }

  public getState(): number {
    return this.state;
  }

  private toggleHeader(b: boolean) {
    if (b) {
      this.getElem('header_rescale').style.display = 'block';
      setTimeout(() => {
        this.getElem('header_rescale').style.top = '0px';
      }, 1);
    } else {
      this.getElem('header_rescale').style.top = '-60px';
      setTimeout(() => {
        this.getElem('header_rescale').style.display = 'none';
      }, 200);
    }
  }

  private toggleFooter(b: boolean) {
    if (b) {
      this.getElem('footer_rescale').style.display = 'block';
      setTimeout(() => {
        this.getElem('footer_rescale').style.bottom = '0px';
      }, 1);
    } else {
      this.getElem('footer_rescale').style.bottom = '-60px';
      setTimeout(() => {
        this.getElem('footer_rescale').style.display = 'none';
      }, 200);
    }
  }

  private toggleRescaler(b: boolean) {
    if (b) {
      this.getElem('overlay_rescale').style.display = 'block';
      setTimeout(() => {
        this.setOffsetRescaler(15, 15);
      }, 1);
    } else {
      this.setOffsetRescaler(15, -200);
      setTimeout(() => {
        this.getElem('overlay_rescale').style.display = 'none';
      }, 200);
    }
  }

  private getElem(name: string): HTMLElement {
    return document.getElementById(name);
  }

  private setOffsetRescaler(x: number, y: number) {
    document.getElementById('overlay_rescale').style.left = x + 'px';
    document.getElementById('overlay_rescale').style.top = y + 'px';
  }

  /*

  private updateState() {
    switch (this.state) {
      case 0:
        this.reset();
        document.exitFullscreen();
        break;
      case 1:
        this.activate();
        setTimeout(()=>{
          this.activateFull();
          document.body.requestFullscreen();
        },500);
        break;
      default: break;
    }
  }

  public reset() {
    window.removeEventListener('keydown', this.f);
    this.f = null;
    this.cachedScale = this.scale;
    this.scaleUpdate();
    this.toggleHeader(true);
    this.toggleFooter(true);
    this.toggleRescaler(false);
    this.state = 0;
  }

  public activate() {
    this.createKeyListener();
    this.setScale(this.cachedScale);
    this.toggleHeader(true);
    this.toggleFooter(true);
    this.setOffsetRescaler(0, 75);
    this.toggleRescaler(true);
    this.state = 1;
  }

  public activateFull() {
    this.createKeyListener();
    this.toggleHeader(false);
    this.toggleFooter(false);
    this.setOffsetRescaler(0, 15);
    this.toggleRescaler(true);
    this.state = 1;
  }

  private createKeyListener() {
    if (!this.f) {
      window.addEventListener('keydown', this.f = e => {
        if (KeyboardUtils.isKeyEvent(e, KeyboardKey.Escape)) {
          this.state=0;
          this.updateState();
        }
      });
    }
  }

  private toggleHeader(b: boolean) {
    if (b) {
      this.getElem('header_rescale').style.display = 'block';
      setTimeout(() => {
        this.getElem('header_rescale').style.top = '0px';
      }, 1);
    } else {
      this.getElem('header_rescale').style.top = '-60px';
      setTimeout(() => {
        this.getElem('header_rescale').style.display = 'none';
      }, 200);
    }
  }

  private toggleFooter(b: boolean) {
    if (b) {
      this.getElem('footer_rescale').style.display = 'block';
      setTimeout(() => {
        this.getElem('footer_rescale').style.bottom = '0px';
      }, 1);
    } else {
      this.getElem('footer_rescale').style.bottom = '-60px';
      setTimeout(() => {
        this.getElem('footer_rescale').style.display = 'none';
      }, 200);
    }
  }

  private getElem(name: string): HTMLElement {
    return document.getElementById(name);
  }

  private toggleRescaler(b: boolean) {
    this.getElem('overlay_rescale').style.display = (b ? 'block' : 'none');
  }

  private setOffsetRescaler(x: number, y: number) {
    document.getElementById('overlay_rescale').style.left = x + 'px';
    document.getElementById('overlay_rescale').style.top = y + 'px';
  }
*/
}
