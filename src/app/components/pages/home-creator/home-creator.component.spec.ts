import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HomeCreatorComponent } from './home-creator.component';

describe('HomeCreatorComponent', () => {
  let component: HomeCreatorComponent;
  let fixture: ComponentFixture<HomeCreatorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HomeCreatorComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HomeCreatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
