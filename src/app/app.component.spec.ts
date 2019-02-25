import { TestBed, async } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { SharedModule } from './components/shared/shared.module';
import { RouterTestingModule } from '@angular/router/testing'
import { AuthenticationService } from './services/http/authentication.service';
import { DataStoreService } from './services/util/data-store.service';
import { NotificationService } from './services/util/notification.service';
import { LanguageService } from './services/util/language.service';

describe('AppComponent', () => {
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [ SharedModule,
                 RouterTestingModule ],
      declarations: [
        AppComponent
      ],
      providers: [
        AuthenticationService,
        DataStoreService,
        NotificationService,
        LanguageService
      ]
    }).compileComponents();
  }));
  it('should create the app', async(() => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  }));
  it(`should have as title 'ARSnova'`, async(() => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app.title).toEqual('ARSnova');
  }));
  it('should render title in a h1 tag', async(() => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.debugElement.nativeElement;
    expect(compiled.querySelector('h1').textContent).toContain('Welcome to app!');
  }));
});
