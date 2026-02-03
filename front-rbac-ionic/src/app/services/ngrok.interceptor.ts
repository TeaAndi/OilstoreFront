import { HttpInterceptorFn } from '@angular/common/http';

export const ngrokInterceptor: HttpInterceptorFn = (req, next) => {
  console.log('🚀 NGROK INTERCEPTOR WORKING'); // Esto DEBE aparecer en consola
  const clonedRequest = req.clone({
    setHeaders: {
      'ngrok-skip-browser-warning': 'true'
    }
  });
  return next(clonedRequest);
};