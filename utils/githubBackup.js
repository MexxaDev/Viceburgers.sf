function toBase64(str) {
  const bytes = new TextEncoder().encode(str);
  const binString = String.fromCodePoint(...bytes);
  return btoa(binString);
}

export async function testConnection(token, owner, repo) {
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
    headers: { Authorization: `token ${token}` }
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || 'Error de conexi\u00f3n');
  }
  return true;
}

export async function uploadFile(token, owner, repo, path, content, message) {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;

  let sha;
  const check = await fetch(url, {
    headers: { Authorization: `token ${token}` }
  });
  if (check.ok) {
    const existing = await check.json();
    sha = existing.sha;
  }

  const body = {
    message,
    content: toBase64(content),
    sha
  };

  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `token ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || 'Error al subir archivo');
  }

  return res.json();
}

export const GITHUB_CONFIG_KEY = {
  TOKEN: 'github_token',
  OWNER: 'github_owner',
  REPO: 'github_repo',
  AUTO_SYNC: 'github_auto_sync'
};

export function loadGitHubConfig() {
  return {
    token: localStorage.getItem(GITHUB_CONFIG_KEY.TOKEN) || '',
    owner: localStorage.getItem(GITHUB_CONFIG_KEY.OWNER) || '',
    repo: localStorage.getItem(GITHUB_CONFIG_KEY.REPO) || '',
    autoSync: localStorage.getItem(GITHUB_CONFIG_KEY.AUTO_SYNC) === 'true'
  };
}

export function saveGitHubConfig(config) {
  localStorage.setItem(GITHUB_CONFIG_KEY.TOKEN, config.token);
  localStorage.setItem(GITHUB_CONFIG_KEY.OWNER, config.owner);
  localStorage.setItem(GITHUB_CONFIG_KEY.REPO, config.repo);
  localStorage.setItem(GITHUB_CONFIG_KEY.AUTO_SYNC, config.autoSync ? 'true' : 'false');
}
