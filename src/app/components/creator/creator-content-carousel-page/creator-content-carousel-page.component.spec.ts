import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CreatorContentCarouselPageComponent } from './creator-content-carousel-page.component';

describe('CreatorContentCarouselPageComponent', () => {
  let component: CreatorContentCarouselPageComponent;
  let fixture: ComponentFixture<CreatorContentCarouselPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CreatorContentCarouselPageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreatorContentCarouselPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
