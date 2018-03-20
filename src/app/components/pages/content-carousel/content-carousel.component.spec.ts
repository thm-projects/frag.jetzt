import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ContentCarouselComponent } from './content-carousel.component';

describe('ContentCarouselComponent', () => {
  let component: ContentCarouselComponent;
  let fixture: ComponentFixture<ContentCarouselComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ContentCarouselComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ContentCarouselComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
