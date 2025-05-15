import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { ImageViewerModalComponent } from './image-viewer-modal.component';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ElementRef } from '@angular/core';

describe('ImageViewerModal Core Tests', () => {
  let component: ImageViewerModalComponent;
  let fixture: ComponentFixture<ImageViewerModalComponent>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<ImageViewerModalComponent>>;

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

    // Create a mock image element
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

    Object.defineProperty(mockImgElement, 'naturalWidth', {
      value: 1200,
      configurable: true,
    });

    Object.defineProperty(mockImgElement, 'naturalHeight', {
      value: 800,
      configurable: true,
    });

    component.imageElement = { nativeElement: mockImgElement } as ElementRef;

    fixture.detectChanges();
  });

  // CORE TEST 1: Basic initialization
  it('should create component with correct initial state', () => {
    expect(component).toBeTruthy();
    expect(component.zoomLevel).toBe(1);
    expect(component.translateX).toBe(0);
    expect(component.translateY).toBe(0);
    expect(component.animationState).toBe('enter');
    expect(dialogRefSpy.disableClose).toBe(true);
    expect(dialogRefSpy.updateSize).toHaveBeenCalledWith('100vw', '100vh');
  });

  // CORE TEST 2: Zoom in/out functionality
  it('should zoom in and out correctly', () => {
    // Initial zoom level
    expect(component.zoomLevel).toBe(1);

    // Test zoom in
    component.zoomIn();
    const zoomedInLevel = component.zoomLevel;
    expect(zoomedInLevel).toBeGreaterThan(1);

    // Test zoom out
    component.zoomOut();
    expect(component.zoomLevel).toBeLessThan(zoomedInLevel);

    // Test reset
    component.zoomLevel = 2;
    component.translateX = 50;
    component.translateY = 30;
    component.resetZoom();
    expect(component.zoomLevel).toBe(1);
    expect(component.translateX).toBe(0);
    expect(component.translateY).toBe(0);
  });

  // CORE TEST 3: Keyboard handling
  it('should handle keyboard shortcuts correctly', () => {
    spyOn(component, 'zoomIn');
    spyOn(component, 'zoomOut');
    spyOn(component, 'resetZoom');
    spyOn(component, 'close');

    // Test plus key
    component.handleKeyboardEvent(new KeyboardEvent('keydown', { key: '+' }));
    expect(component.zoomIn).toHaveBeenCalled();

    // Test minus key
    component.handleKeyboardEvent(new KeyboardEvent('keydown', { key: '-' }));
    expect(component.zoomOut).toHaveBeenCalled();

    // Test R key
    component.handleKeyboardEvent(new KeyboardEvent('keydown', { key: 'r' }));
    expect(component.resetZoom).toHaveBeenCalled();

    // Test Escape key
    component.handleKeyboardEvent(
      new KeyboardEvent('keydown', { key: 'Escape' }),
    );
    expect(component.close).toHaveBeenCalled();
  });

  // CORE TEST 4: Touch handling
  it('should handle touch events for zoom', () => {
    // Mock touch events with two fingers
    const touchStartEvent = {
      preventDefault: jasmine.createSpy('preventDefault'),
      stopPropagation: jasmine.createSpy('stopPropagation'),
      touches: [
        { clientX: 100, clientY: 100 },
        { clientX: 200, clientY: 200 },
      ],
    } as unknown as TouchEvent;

    spyOn(component, 'adjustZoom');

    // Start touch gesture
    component.handleTouchStart(touchStartEvent);

    // Move fingers apart
    const touchMoveEvent = {
      preventDefault: jasmine.createSpy('preventDefault'),
      stopPropagation: jasmine.createSpy('stopPropagation'),
      touches: [
        { clientX: 50, clientY: 50 },
        { clientX: 250, clientY: 250 },
      ],
    } as unknown as TouchEvent;

    component.handleTouchMove(touchMoveEvent);

    expect(component.adjustZoom).toHaveBeenCalled();
  });

  // CORE TEST 5: Close behavior
  it('should close with animation', fakeAsync(() => {
    component.close();
    expect(component.animationState).toBe('leave');

    // After animation time
    tick(200);
    expect(dialogRefSpy.close).toHaveBeenCalled();
  }));

  // CORE TEST 6: Toggle zoom with double-click
  it('should toggle zoom on double-click', () => {
    expect(component.zoomLevel).toBe(1);

    // Simulate double-click
    component.toggleZoom(new MouseEvent('dblclick'));
    expect(component.zoomLevel).toBe(2);

    // Double-click again to reset
    component.toggleZoom(new MouseEvent('dblclick'));
    expect(component.zoomLevel).toBe(1);
  });

  // CORE TEST 7: Zoom constraints
  it('should enforce minimum and maximum zoom levels', () => {
    // Set to minimum zoom
    component.zoomLevel = component.minZoom;
    component.zoomOut();
    expect(component.zoomLevel).toBe(component.minZoom);

    // Set to maximum zoom
    component.zoomLevel = component.maxZoom;
    component.zoomIn();
    expect(component.zoomLevel).toBe(component.maxZoom);
  });
});
