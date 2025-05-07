import { ComponentFixture, TestBed } from '@angular/core/testing';
import { YtVideoWrapperComponent } from './yt-video-wrapper.component';

describe('YtVideoWrapperComponent', () => {
  let fixture: ComponentFixture<YtVideoWrapperComponent>;
  let component: YtVideoWrapperComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [YtVideoWrapperComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(YtVideoWrapperComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('falls back to English when no input or signal language', () => {
    fixture.detectChanges();
    expect(component.videoTitle()).toBe('Introduction to frag.jetzt');
  });

  it('uses German when @Input langKey="de"', () => {
    component.langKey = 'de';
    fixture.detectChanges();
    expect(component.videoTitle()).toBe('Einführung in frag.jetzt');
  });

  it('uses French when @Input langKey="fr"', () => {
    component.langKey = 'fr';
    fixture.detectChanges();
    expect(component.videoTitle()).toBe('Présentation de frag.jetzt');
  });

  it('should show iframe and hide button after playVideo()', () => {
    fixture.detectChanges();
    const button: HTMLElement | null =
      fixture.nativeElement.querySelector('button');
    button.click();
    fixture.detectChanges();
    expect(component.isAccepted).toBeTrue();
    expect(fixture.nativeElement.querySelector('button')).toBeNull();
    expect(fixture.nativeElement.querySelector('iframe')).toBeTruthy();
  });

  it('button has correct aria-label', () => {
    fixture.detectChanges();
    const btn: HTMLElement | null =
      fixture.nativeElement.querySelector('button');
    expect(btn.getAttribute('aria-label')).toBe('Play video preview');
  });

  it('iframeSrc includes cc_load_policy=1', () => {
    component.langKey = 'en';
    fixture.detectChanges();
    const safeUrl = component.iframeSrc();
    expect((safeUrl as any).changingThisBreaksApplicationSecurity).toContain(
      '?cc_load_policy=1',
    );
  });

  it('onResize sets iframe height correctly', () => {
    component.isAccepted = true;
    fixture.detectChanges();
    const iframe: HTMLIFrameElement =
      fixture.nativeElement.querySelector('iframe');
    spyOn(window, 'getComputedStyle').and.returnValue({
      width: '160px',
    } as any);
    component.onResize();
    expect(iframe.style.height).toBe('90px');
  });
});
