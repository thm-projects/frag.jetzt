import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RestrictionsBlockComponent } from './restrictions-block.component';

describe('RestrictionsBlockComponent', () => {
  let component: RestrictionsBlockComponent;
  let fixture: ComponentFixture<RestrictionsBlockComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RestrictionsBlockComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RestrictionsBlockComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
