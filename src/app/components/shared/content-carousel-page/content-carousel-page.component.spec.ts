import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ContentCarouselPageComponent } from './content-carousel-page.component';

describe('ContentCarouselPageComponent', () => {
  let component: ContentCarouselPageComponent;
  let fixture: ComponentFixture<ContentCarouselPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ContentCarouselPageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ContentCarouselPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
