// auth.js — MSAL.js 認証モジュール
// アプリ登録後に CLIENT_ID を差し替えてください

const CLIENT_ID = 'fffbcd12-7589-4e3a-8886-46a71eb30ba0';

const msalConfig = {
  auth: {
    clientId: CLIENT_ID,
    authority: 'https://login.microsoftonline.com/common',
    redirectUri: window.location.origin + window.location.pathname,
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false,
  },
};

const msalInstance = new msal.PublicClientApplication(msalConfig);

// Dataverse スコープ（環境URLは後から動的に指定）
function getDataverseScopes(envUrl) {
  const base = envUrl.replace(/\/$/, '');
  return [`${base}/user_impersonation`];
}

async function initAuth() {
  // リダイレクト応答の処理
  const response = await msalInstance.handleRedirectPromise();
  if (response) {
    msalInstance.setActiveAccount(response.account);
  }

  const accounts = msalInstance.getAllAccounts();
  if (accounts.length > 0) {
    msalInstance.setActiveAccount(accounts[0]);
  }

  return msalInstance.getActiveAccount();
}

async function login() {
  await msalInstance.loginRedirect({
    scopes: ['openid', 'profile', 'email', 'offline_access'],
  });
}

async function logout() {
  await msalInstance.logoutRedirect({
    postLogoutRedirectUri: window.location.origin + window.location.pathname,
  });
}

async function getToken(envUrl) {
  const account = msalInstance.getActiveAccount();
  if (!account) throw new Error('Not signed in');

  const scopes = getDataverseScopes(envUrl);

  try {
    // サイレント取得を試みる
    const result = await msalInstance.acquireTokenSilent({ scopes, account });
    return result.accessToken;
  } catch (e) {
    if (e instanceof msal.InteractionRequiredAuthError) {
      // インタラクション必要な場合はポップアップ
      const result = await msalInstance.acquireTokenPopup({ scopes, account });
      return result.accessToken;
    }
    throw e;
  }
}
