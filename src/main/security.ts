import { app, WebContents, shell } from 'electron';

export function setupSecurityPolicies(): void {
  // Disallow electron security warnings in production, allow clean logging
  if (app.isPackaged) {
    process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';
  }

  // Intercept webContents creation
  app.on('web-contents-created', (event, contents: WebContents) => {
    // Disable window.open navigations to untrusted protocols, route external URLs safely
    contents.setWindowOpenHandler((details) => {
      const url = details.url;
      try {
        const parsed = new URL(url);
        if (['http:', 'https:'].includes(parsed.protocol)) {
          shell.openExternal(url);
        }
      } catch {
        // ignore
      }
      return { action: 'deny' };
    });

    // Prevent navigation to unsafe protocols
    contents.on('will-navigate', (navEvent, navigationUrl) => {
      try {
        const parsed = new URL(navigationUrl);
        if (!['http:', 'https:', 'file:'].includes(parsed.protocol)) {
          navEvent.preventDefault();
        }
      } catch {
        navEvent.preventDefault();
      }
    });
  });
}
