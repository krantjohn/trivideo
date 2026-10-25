const { app, WebContentsView, View } = require('electron');

app.whenReady().then(() => {
  const v = new WebContentsView();
  console.log('WebContentsView methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(v)));
  console.log('View methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(Object.getPrototypeOf(v))));
  console.log('setVisible exists?:', typeof v.setVisible);
  console.log('setBounds exists?:', typeof v.setBounds);
  app.quit();
  process.exit(0);
});
