import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TopicCloudDialogComponent } from './topic-cloud-dialog.component';

describe('TopicCloudDialogComponent', () => {
  let component: TopicCloudDialogComponent;
  let fixture: ComponentFixture<TopicCloudDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TopicCloudDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TopicCloudDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
