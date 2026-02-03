import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ngrokInterceptor } from './app/services/ngrok.interceptor'; // Asegúrate que esta ruta sea correcta
import { provideIonicAngular } from '@ionic/angular/standalone';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
bootstrapApplication(AppComponent, {
  providers: [
    provideIonicAngular(),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([ngrokInterceptor])
    ),
  ],
}).catch((err) => console.error(err));