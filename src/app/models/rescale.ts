
export class Rescale {

  public scale = 1;
  public cachedScale = 1;
  private f;

  public scaleUp() {
    this.setScale(this.scale + 0.1);
  }

  public scaleDown() {
    this.setScale(this.scale - 0.1);
  }

  public scaleUndo() {
    this.setScale(1);
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

  private scaleUpdate() {
    document.getElementById('rescale_screen').style.zoom = this.scale + '';
  }

  public activeScale() {
    window.addEventListener('keydown', this.f = e => {
      if (e.key === 'Escape') {
        this.deactivateScale();
      }
    });
    this.setScale(this.cachedScale);
    this.setStateScale(true);
  }

  public deactivateScale() {
    window.removeEventListener('keydown', this.f);
    this.cachedScale = this.scale;
    this.scaleUndo();
    this.setStateScale(false);
  }

  private setStateScale(b: boolean) {
    document.getElementById('header_rescale').style.display = (b ? 'none' : 'block');
    document.getElementById('footer_rescale').style.display = (b ? 'none' : 'block');
    document.getElementById('overlay_rescale').style.display = (b ? 'block' : 'none');
  }

}
