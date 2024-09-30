import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TokenExplanationDialogComponent } from './token-explanation-dialog.component';

describe('TokenExplanationDialogComponent', () => {
  let component: TokenExplanationDialogComponent;
  let fixture: ComponentFixture<TokenExplanationDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TokenExplanationDialogComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TokenExplanationDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
