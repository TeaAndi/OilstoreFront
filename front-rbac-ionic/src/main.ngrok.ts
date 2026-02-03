import { ngrokInterceptor } from './app/services/ngrok.interceptor';
import { authInterceptor } from './app/services/auth.interceptor';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideIonicAngular } from '@ionic/angular/standalone';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([
      ngrokInterceptor,
      authInterceptor
    ])),
    provideIonicAngular(),
  ],
});
