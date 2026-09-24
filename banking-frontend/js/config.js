/**
 * NovaBank API & Keycloak Configuration
 */
const API_CONFIG = {
  // If served via Nginx (port 8080), relative paths route through the reverse proxy.
  // If served standalone (e.g. live-server / python http.server), falls back to direct ports.
  get baseUrl() {
    if (window.location.port === '8080') {
      return ''; // Nginx routes /api/* to backend
    }
    return 'http://localhost:8081'; // Direct backend
  },

  get keycloakTokenUrl() {
    if (window.location.port === '8080') {
      return '/auth/realms/banking-realm/protocol/openid-connect/token';
    }
    // Direct Keycloak port or Nginx gateway
    return 'http://localhost:8080/realms/banking-realm/protocol/openid-connect/token';
  },

  clientId: 'banking-client',
  realm: 'banking-realm'
};

function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

function getStoredAuth() {
  const token = localStorage.getItem('access_token');
  const user = localStorage.getItem('bank_user');
  const roles = JSON.parse(localStorage.getItem('bank_roles') || '[]');
  return { token, user, roles };
}

function setStoredAuth(token, username, roles) {
  localStorage.setItem('access_token', token);
  localStorage.setItem('bank_user', username);
  localStorage.setItem('bank_roles', JSON.stringify(roles || []));
}

function clearAuth() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('bank_user');
  localStorage.removeItem('bank_roles');
}

/**
 * Perform login against Keycloak OpenID Connect token endpoint,
 * falling back to backend's standalone /api/auth/login if Keycloak is offline.
 */
async function keycloakLogin(username, password) {
  let tokenData = null;

  // 1. Try Keycloak OpenID Connect token endpoint first
  try {
    const params = new URLSearchParams();
    params.append('client_id', API_CONFIG.clientId);
    params.append('grant_type', 'password');
    params.append('username', username);
    params.append('password', password);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const response = await fetch(API_CONFIG.keycloakTokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      tokenData = await response.json();
    }
  } catch (err) {
    console.warn('Keycloak OIDC endpoint not reachable, trying standalone backend auth:', err.message);
  }

  // 2. Fall back to backend /api/auth/login if Keycloak is unavailable
  if (!tokenData) {
    const fallbackRes = await fetch(`${API_CONFIG.baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    if (!fallbackRes.ok) {
      const errText = await fallbackRes.text();
      let message = 'Authentication failed';
      try {
        const errJson = JSON.parse(errText);
        message = errJson.message || errJson.error || message;
      } catch (_) {
        message = `Server returned ${fallbackRes.status}: ${fallbackRes.statusText}`;
      }
      throw new Error(message);
    }
    tokenData = await fallbackRes.json();
  }

  const jwt = parseJwt(tokenData.access_token);
  const roles = (tokenData.roles && Array.isArray(tokenData.roles))
    ? tokenData.roles
    : ((jwt && jwt.realm_access && jwt.realm_access.roles) ? jwt.realm_access.roles : []);
  const displayName = (jwt && (jwt.name || jwt.preferred_username)) ? (jwt.name || jwt.preferred_username) : username;

  setStoredAuth(tokenData.access_token, displayName, roles);
  return { token: tokenData.access_token, user: displayName, roles };
}

/**
 * Standard API request wrapper with JWT Bearer authentication and comprehensive error handling
 */
async function apiRequest(path, options = {}) {
  const { token } = getStoredAuth();
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_CONFIG.baseUrl}${path}`;
  const response = await fetch(url, { ...options, headers });

  if (response.status === 204) {
    return null;
  }

  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (_) {
    data = text;
  }

  if (!response.ok) {
    let errMsg = 'Unable to complete request. Please try again.';
    if (response.status === 401) {
      errMsg = 'Your session has expired. Please login again.';
      clearAuth();
      setTimeout(() => {
        if (!window.location.pathname.endsWith('index.html') && !window.location.pathname.endsWith('register.html')) {
          window.location.href = 'index.html';
        }
      }, 1500);
    } else if (response.status === 403) {
      errMsg = 'You do not have permission to perform this action.';
    } else if (response.status === 404) {
      errMsg = 'The requested resource was not found.';
    } else if (data && typeof data === 'object' && data.message) {
      errMsg = data.message;
    }
    const error = new Error(errMsg);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}
