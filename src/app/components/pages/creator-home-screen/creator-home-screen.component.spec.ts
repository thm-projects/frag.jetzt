import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CreatorHomeScreenComponent } from './creator-home-screen.component';

describe('CreatorHomeScreenComponent', () => {
  let component: CreatorHomeScreenComponent;
  let fixture: ComponentFixture<CreatorHomeScreenComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CreatorHomeScreenComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreatorHomeScreenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
