const test = require('node:test');
const assert = require('node:assert');

function analyzeLoginStatus(platform, cookies) {
  let isLoggedIn = false;
  let accountName = undefined;

  if (platform === 'bilibili') {
    const sessdata = cookies.find((c) => c.name === 'SESSDATA');
    const dedeId = cookies.find((c) => c.name === 'DedeUserID');
    isLoggedIn = Boolean(sessdata && sessdata.value);
    if (dedeId && dedeId.value) {
      accountName = `UID: ${dedeId.value}`;
    }
  } else if (platform === 'douyin') {
    const sessionid = cookies.find((c) => c.name === 'sessionid' || c.name === 'sessionid_ss');
    const uid = cookies.find((c) => c.name === 'passport_auth_status' || c.name === 'passport_auth_status_ss');
    const sidTt = cookies.find((c) => c.name === 'sid_tt' || c.name === 'uid_tt');
    isLoggedIn = Boolean((sessionid && sessionid.value) || (sidTt && sidTt.value));
    if (uid && uid.value) {
      accountName = '已登录用户';
    }
  } else if (platform === 'xiaohongshu') {
    const webSession = cookies.find((c) => c.name === 'web_session' || c.name === 'web_session_ss');
    const userId = cookies.find((c) => c.name === 'customer_client_id');
    isLoggedIn = Boolean(webSession && webSession.value);
    if (userId) {
      accountName = '小红书会员';
    }
  } else if (platform === 'youtube') {
    const loginCookie = cookies.find(
      (c) => c.name === 'LOGIN_INFO' || c.name === 'SAPISID' || c.name === '__Secure-3PSID' || c.name === 'SID'
    );
    isLoggedIn = Boolean(loginCookie && loginCookie.value);
    if (isLoggedIn) {
      accountName = 'YouTube用户';
    }
  } else if (platform === 'kuaishou') {
    const webSt = cookies.find((c) => c.name === 'kuaishou.server.web_st' || c.name === 'passToken');
    const userId = cookies.find((c) => c.name === 'userId');
    isLoggedIn = Boolean(webSt && webSt.value);
    if (userId && userId.value) {
      accountName = `快手用户: ${userId.value}`;
    } else if (isLoggedIn) {
      accountName = '快手会员';
    }
  }

  return {
    platform,
    isLoggedIn,
    cookieCount: cookies.length,
    accountName,
  };
}

test('Session Logic: Bilibili login cookie identification', (t) => {
  const loggedOut = analyzeLoginStatus('bilibili', [
    { name: 'buvid3', value: '123' },
    { name: '_uuid', value: 'abc' },
  ]);
  assert.strictEqual(loggedOut.isLoggedIn, false);
  assert.strictEqual(loggedOut.accountName, undefined);

  const loggedIn = analyzeLoginStatus('bilibili', [
    { name: 'buvid3', value: '123' },
    { name: 'SESSDATA', value: 'secure-token-xyz' },
    { name: 'DedeUserID', value: '3829471' },
  ]);
  assert.strictEqual(loggedIn.isLoggedIn, true);
  assert.strictEqual(loggedIn.accountName, 'UID: 3829471');
});

test('Session Logic: Douyin login cookie identification with standard and secure tokens', (t) => {
  const loggedOut = analyzeLoginStatus('douyin', [
    { name: 'ttwid', value: '123' },
  ]);
  assert.strictEqual(loggedOut.isLoggedIn, false);

  // Standard sessionid
  const loggedIn = analyzeLoginStatus('douyin', [
    { name: 'ttwid', value: '123' },
    { name: 'sessionid', value: 'douyin-sess-987' },
    { name: 'passport_auth_status', value: 'verified' },
  ]);
  assert.strictEqual(loggedIn.isLoggedIn, true);
  assert.strictEqual(loggedIn.accountName, '已登录用户');

  // Modern sessionid_ss and passport_auth_status_ss
  const loggedInModern = analyzeLoginStatus('douyin', [
    { name: 'sessionid_ss', value: 'douyin-sess-secure' },
    { name: 'passport_auth_status_ss', value: '1' },
  ]);
  assert.strictEqual(loggedInModern.isLoggedIn, true);
  assert.strictEqual(loggedInModern.accountName, '已登录用户');
});

test('Session Logic: Xiaohongshu login cookie identification', (t) => {
  const loggedOut = analyzeLoginStatus('xiaohongshu', [
    { name: 'a1', value: 'token-a1' },
  ]);
  assert.strictEqual(loggedOut.isLoggedIn, false);

  const loggedIn = analyzeLoginStatus('xiaohongshu', [
    { name: 'a1', value: 'token-a1' },
    { name: 'web_session', value: 'xhs-session-456' },
    { name: 'customer_client_id', value: '1001' },
  ]);
  assert.strictEqual(loggedIn.isLoggedIn, true);
  assert.strictEqual(loggedIn.accountName, '小红书会员');

  // web_session_ss variant
  const loggedInSs = analyzeLoginStatus('xiaohongshu', [
    { name: 'web_session_ss', value: 'xhs-session-ss' },
  ]);
  assert.strictEqual(loggedInSs.isLoggedIn, true);
});

test('Session Logic: YouTube login cookie identification', (t) => {
  const loggedOut = analyzeLoginStatus('youtube', [
    { name: 'YSC', value: 'guest-session' },
    { name: 'PREF', value: 'f1=50000000' },
  ]);
  assert.strictEqual(loggedOut.isLoggedIn, false);
  assert.strictEqual(loggedOut.accountName, undefined);

  const loggedInInfo = analyzeLoginStatus('youtube', [
    { name: 'LOGIN_INFO', value: 'AFmmF2cwRQIhA...' },
  ]);
  assert.strictEqual(loggedInInfo.isLoggedIn, true);
  assert.strictEqual(loggedInInfo.accountName, 'YouTube用户');

  const loggedInGoogleAuth = analyzeLoginStatus('youtube', [
    { name: 'SAPISID', value: 'secret-sapisid' },
    { name: '__Secure-3PSID', value: 'secure-token' },
  ]);
  assert.strictEqual(loggedInGoogleAuth.isLoggedIn, true);
  assert.strictEqual(loggedInGoogleAuth.accountName, 'YouTube用户');
});

test('Session Logic: Kuaishou login cookie identification', (t) => {
  const loggedOut = analyzeLoginStatus('kuaishou', [
    { name: 'did', value: 'web_guest_did' },
    { name: 'kpn', value: 'KUAISHOU_VISION' },
  ]);
  assert.strictEqual(loggedOut.isLoggedIn, false);
  assert.strictEqual(loggedOut.accountName, undefined);

  const loggedInWithUid = analyzeLoginStatus('kuaishou', [
    { name: 'did', value: 'web_did' },
    { name: 'kuaishou.server.web_st', value: 'ticket_st_xyz' },
    { name: 'userId', value: '987654321' },
  ]);
  assert.strictEqual(loggedInWithUid.isLoggedIn, true);
  assert.strictEqual(loggedInWithUid.accountName, '快手用户: 987654321');

  const loggedInPassToken = analyzeLoginStatus('kuaishou', [
    { name: 'passToken', value: 'pass_token_xyz' },
  ]);
  assert.strictEqual(loggedInPassToken.isLoggedIn, true);
  assert.strictEqual(loggedInPassToken.accountName, '快手会员');
});
