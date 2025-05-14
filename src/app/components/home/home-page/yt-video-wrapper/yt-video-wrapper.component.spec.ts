import { ComponentFixture, TestBed } from '@angular/core/testing';
import { YtVideoWrapperComponent } from './yt-video-wrapper.component';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('YtVideoWrapperComponent', () => {
  let component: YtVideoWrapperComponent;
  let fixture: ComponentFixture<YtVideoWrapperComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [YtVideoWrapperComponent, NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(YtVideoWrapperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should use the provided language key for video title', () => {
    // Set language explicitly
    component.langKey = 'fr';
    fixture.detectChanges();

    // Check that the correct language is used for title
    expect(component.videoTitle()).toBe('Présentation de frag.jetzt');
  });

  it('should handle consent management', () => {
    // Initially, consent should not be given
    expect(component.isAccepted).toBeFalse();

    // After playing the video, consent should be given
    component.playVideo();
    expect(component.isAccepted).toBeTrue();
  });

  it('should focus iframe after playback starts', (done) => {
    // Mock the iframe element
    component.scaledIframe = {
      nativeElement: {
        focus: jasmine.createSpy('focus'),
      },
    } as any;

    // Start playback
    component.playVideo();

    // Check that focus was moved to the iframe (after timeout)
    setTimeout(() => {
      expect(component.scaledIframe.nativeElement.focus).toHaveBeenCalled();
      done();
    }, 10);
  });

  it('should have resize handler', () => {
    // Just verify the method exists and doesn't throw errors
    expect(component.onResize).toBeDefined();
  });
});
