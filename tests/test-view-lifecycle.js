const { app, BrowserWindow, WebContentsView } = require('electron');

app.whenReady().then(async () => {
  const win = new BrowserWindow({ width: 800, height: 600, show: false });
  const view1 = new WebContentsView();
  const view2 = new WebContentsView();

  win.contentView.addChildView(view1);
  view1.setBounds({ x: 0, y: 0, width: 800, height: 600 });
  await view1.webContents.loadURL('data:text/html,<h1>View 1 Loaded</h1><input id="test" value="Initial Value">');

  // Change input value in view 1
  await view1.webContents.executeJavaScript('document.getElementById("test").value = "Modified Value";');

  // Now remove view 1 from contentView and add view 2
  console.log('Removing view 1 from contentView...');
  win.contentView.removeChildView(view1);

  win.contentView.addChildView(view2);
  view2.setBounds({ x: 0, y: 0, width: 800, height: 600 });
  await view2.webContents.loadURL('data:text/html,<h1>View 2 Loaded</h1>');

  // Now remove view 2 and re-add view 1
  console.log('Re-adding view 1 to contentView...');
  win.contentView.removeChildView(view2);
  win.contentView.addChildView(view1);
  view1.setBounds({ x: 0, y: 0, width: 800, height: 600 });

  // Check if input value in view 1 is preserved
  const val = await view1.webContents.executeJavaScript('document.getElementById("test")?.value');
  console.log('View 1 input value after re-adding:', val);
  console.log('Is preserved?:', val === 'Modified Value');

  app.quit();
  process.exit(0);
});
