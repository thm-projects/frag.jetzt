import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LayerPaneComponent } from './layer-pane.component';

describe('LayerPaneComponent', () => {
  let component: LayerPaneComponent;
  let fixture: ComponentFixture<LayerPaneComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LayerPaneComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LayerPaneComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
