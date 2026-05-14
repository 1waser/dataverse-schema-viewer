// auth.js — MSAL.js 3.x 認証モジュール

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

let msalInstance = null;

async function initAuth() {
  msalInstance = new msal.PublicClientApplication(msalConfig);
  await msalInstance.initialize();

  const response = await msalInstance.handleRedirectPromise();
  if (response?.account) {
    msalInstance.setActiveAccount(response.account);
    return response.account;
  }

  const accounts = msalInstance.getAllAccounts();
  if (accounts.length > 0) {
    msalInstance.setActiveAccount(accounts[0]);
    return accounts[0];
  }

  return null;
}

async function login() {
  await msalInstance.loginRedirect({
    scopes: ['openid', 'profile', 'email', 'offline_access'],
  });
}

async function logout() {
  sessionStorage.clear();
  localStorage.clear();
  try {
    await msalInstance.logoutRedirect({
      postLogoutRedirectUri: window.location.origin + window.location.pathname,
    });
  } catch {
    location.href = window.location.origin + window.location.pathname;
  }
}

async function getToken(envUrl) {
  const account = msalInstance.getActiveAccount();
  if (!account) throw new Error('Not signed in');

  const scopes = [`${envUrl.replace(/\/$/, '')}/user_impersonation`];

  try {
    const result = await msalInstance.acquireTokenSilent({ scopes, account });
    return result.accessToken;
  } catch (e) {
    if (e instanceof msal.InteractionRequiredAuthError) {
      const result = await msalInstance.acquireTokenPopup({ scopes, account });
      return result.accessToken;
    }
    throw e;
  }
}
