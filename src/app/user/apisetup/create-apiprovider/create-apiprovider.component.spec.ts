import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateAPIProviderComponent } from './create-apiprovider.component';

describe('CreateAPIProviderComponent', () => {
  let component: CreateAPIProviderComponent;
  let fixture: ComponentFixture<CreateAPIProviderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateAPIProviderComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateAPIProviderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
