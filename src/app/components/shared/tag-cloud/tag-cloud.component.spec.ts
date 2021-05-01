import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TagCloudComponent } from './tag-cloud.component';

describe('TagCloudComponent', () => {
  let component: TagCloudComponent;
  let fixture: ComponentFixture<TagCloudComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TagCloudComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TagCloudComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
