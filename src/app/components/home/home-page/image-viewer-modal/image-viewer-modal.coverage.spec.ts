import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ImageViewerModalComponent } from './image-viewer-modal.component';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ElementRef } from '@angular/core';
import { By } from '@angular/platform-browser';

describe('ImageViewerModal Coverage Tests', () => {
  let component: ImageViewerModalComponent;
  let fixture: ComponentFixture<ImageViewerModalComponent>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<ImageViewerModalComponent>>;
  let nativeElement: HTMLElement;

  const mockImageData = {
    imageUrl: 'test-image.jpg',
    altText: 'Test Image',
  };

  beforeEach(async () => {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', [
      'close',
      'updateSize',
    ]);

    await TestBed.configureTestingModule({
      imports: [NoopAnimationsModule, ImageViewerModalComponent],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: mockImageData },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ImageViewerModalComponent);
    component = fixture.componentInstance;

    // Mock image element with detailed properties
    const mockImgElement = document.createElement('img');
    Object.defineProperty(mockImgElement, 'getBoundingClientRect', {
      value: () => ({
        width: 800,
        height: 600,
        top: 100,
        left: 100,
        right: 900,
        bottom: 700,
        x: 100,
        y: 100,
      }),
      configurable: true,
    });

    Object.defineProperty(mockImgElement, 'naturalWidth', { value: 1200 });
    Object.defineProperty(mockImgElement, 'naturalHeight', { value: 800 });

    component.imageElement = { nativeElement: mockImgElement } as ElementRef;

    fixture.detectChanges();
  });

  // Testing DOM interaction and button functionality
  describe('UI Interactions', () => {
    it('should disable zoom out button at minimum zoom', () => {
      component.zoomLevel = component.minZoom;
      fixture.detectChanges();

      const zoomOutButton = fixture.debugElement.query(
        By.css('button:first-child'),
      );
      expect(zoomOutButton.nativeElement.disabled).toBe(true);
    });

    it('should disable zoom in button at maximum zoom', () => {
      component.zoomLevel = component.maxZoom;
      fixture.detectChanges();

      // Use more reliable selector (third button is zoom in)
      const zoomInButton = fixture.debugElement.queryAll(By.css('button'))[2];
      expect(zoomInButton.nativeElement.disabled).toBe(true);
    });

    it('should disable reset button when zoom is default', () => {
      component.zoomLevel = 1;
      component.translateX = 0;
      component.translateY = 0;
      fixture.detectChanges();

      // Use more reliable selector (second button is reset)
      const resetButton = fixture.debugElement.queryAll(By.css('button'))[1];
      expect(resetButton.nativeElement.disabled).toBe(true);
    });

    it('should trigger proper methods when buttons are clicked', () => {
      spyOn(component, 'handleZoomOutClick');
      spyOn(component, 'handleZoomInClick');
      spyOn(component, 'resetZoom');
      spyOn(component, 'close');

      const buttons = fixture.debugElement.queryAll(By.css('button'));

      // Simulate clicks with proper event objects
      const mockEvent = {
        stopPropagation: jasmine.createSpy('stopPropagation'),
      };

      // 0: Zoom out button
      buttons[0].triggerEventHandler('click', mockEvent);
      expect(component.handleZoomOutClick).toHaveBeenCalled();

      // 1: Reset button
      buttons[1].triggerEventHandler('click', mockEvent);
      expect(component.resetZoom).toHaveBeenCalled();

      // 2: Zoom in button
      buttons[2].triggerEventHandler('click', mockEvent);
      expect(component.handleZoomInClick).toHaveBeenCalled();

      // 3: Close button
      buttons[3].triggerEventHandler('click', mockEvent);
      expect(component.close).toHaveBeenCalled();
    });
  });

  // Reset test - this one should work
  it('should reset translation when zoom is 1', () => {
    // Set non-zero translation
    component.translateX = 50;
    component.translateY = 70;

    // Set zoom to 1
    component.zoomLevel = 1;
    component.constrainTranslation();

    // Translation should be reset
    expect(component.translateX).toBe(0);
    expect(component.translateY).toBe(0);
  });

  // Test all touch button events
  describe('Touch Button Events', () => {
    it('should handle touch events on zoom out button', () => {
      const touchEvent = {
        preventDefault: jasmine.createSpy('preventDefault'),
        stopPropagation: jasmine.createSpy('stopPropagation'),
        target: document.createElement('button'),
      } as unknown as TouchEvent;

      spyOn(component, 'zoomOut');

      component.handleTouchButtonStart(touchEvent);
      component.handleZoomOutTouch(touchEvent);

      expect(touchEvent.preventDefault).toHaveBeenCalled();
      expect(touchEvent.stopPropagation).toHaveBeenCalled();
      expect(component.zoomOut).toHaveBeenCalled();
    });

    it('should handle touch events on zoom in button', () => {
      const touchEvent = {
        preventDefault: jasmine.createSpy('preventDefault'),
        stopPropagation: jasmine.createSpy('stopPropagation'),
        target: document.createElement('button'),
      } as unknown as TouchEvent;

      spyOn(component, 'zoomIn');

      component.handleTouchButtonStart(touchEvent);
      component.handleZoomInTouch(touchEvent);

      expect(touchEvent.preventDefault).toHaveBeenCalled();
      expect(touchEvent.stopPropagation).toHaveBeenCalled();
      expect(component.zoomIn).toHaveBeenCalled();
    });

    it('should handle touch events on reset button', () => {
      const touchEvent = {
        preventDefault: jasmine.createSpy('preventDefault'),
        stopPropagation: jasmine.createSpy('stopPropagation'),
        target: document.createElement('button'),
      } as unknown as TouchEvent;

      spyOn(component, 'resetZoom');

      component.handleTouchButtonStart(touchEvent);
      component.handleResetZoomTouch(touchEvent);

      expect(touchEvent.preventDefault).toHaveBeenCalled();
      expect(touchEvent.stopPropagation).toHaveBeenCalled();
      expect(component.resetZoom).toHaveBeenCalled();
    });

    it('should handle touch events on close button', () => {
      const touchEvent = {
        preventDefault: jasmine.createSpy('preventDefault'),
        stopPropagation: jasmine.createSpy('stopPropagation'),
        target: document.createElement('button'),
      } as unknown as TouchEvent;

      spyOn(component, 'close');

      component.handleTouchButtonStart(touchEvent);
      component.handleCloseTouch(touchEvent);

      expect(touchEvent.preventDefault).toHaveBeenCalled();
      expect(touchEvent.stopPropagation).toHaveBeenCalled();
      expect(component.close).toHaveBeenCalled();
    });
  });

  // Additional touch edge cases
  describe('Touch Event Edge Cases', () => {
    it('should handle touchend correctly', () => {
      component.handleTouchEnd();

      // No errors should be thrown
      expect(true).toBe(true);
    });

    it('should handle touchmove with zero fingers', () => {
      const touchMoveEvent = {
        preventDefault: jasmine.createSpy('preventDefault'),
        stopPropagation: jasmine.createSpy('stopPropagation'),
        touches: [],
      } as unknown as TouchEvent;

      // This should not throw errors
      component.handleTouchMove(touchMoveEvent);
      expect(touchMoveEvent.preventDefault).toHaveBeenCalled();
    });
  });

  // Wheel zoom tests
  describe('Wheel Zoom', () => {
    it('should zoom in on wheel up with ctrl key', () => {
      const initialZoom = component.zoomLevel;
      const wheelEvent = new WheelEvent('wheel', {
        deltaY: -100, // Scroll up
        ctrlKey: true,
      });

      component.handleZoom(wheelEvent);

      expect(component.zoomLevel).toBeGreaterThan(initialZoom);
    });

    it('should zoom out on wheel down with ctrl key', () => {
      component.zoomLevel = 2; // Start at zoomed level
      const initialZoom = component.zoomLevel;
      const wheelEvent = new WheelEvent('wheel', {
        deltaY: 100, // Scroll down
        ctrlKey: true,
      });

      component.handleZoom(wheelEvent);

      expect(component.zoomLevel).toBeLessThan(initialZoom);
    });

    it('should not zoom without ctrl key', () => {
      const initialZoom = component.zoomLevel;
      const wheelEvent = new WheelEvent('wheel', {
        deltaY: -100, // Scroll up
        ctrlKey: false, // No ctrl key
      });

      component.handleZoom(wheelEvent);

      expect(component.zoomLevel).toBe(initialZoom);
    });
  });
});
