import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.Pusher = Pusher;

const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';

const echo = new Echo({
  broadcaster: 'reverb',
  key: import.meta.env.VITE_REVERB_APP_KEY || 'film-os-key',
  wsHost: import.meta.env.VITE_REVERB_HOST || window.location.hostname,
  wsPort: import.meta.env.VITE_REVERB_PORT || 8080,
  wssPort: import.meta.env.VITE_REVERB_PORT || 443,
  // Must match the page's own protocol: an https:// page cannot open a
  // plain ws:// connection (browsers block it as mixed content), which
  // silently killed real-time updates in production.
  forceTLS: isHttps,
  enabledTransports: isHttps ? ['wss'] : ['ws', 'wss'],
  // Private channels (e.g. scripts.{filmId}) need to authenticate via
  // /broadcasting/auth. This app has no session cookie — auth is a
  // Sanctum Bearer token — so we authorize manually instead of relying
  // on Echo's default cookie-based XHR.
  authEndpoint: '/api/broadcasting/auth',
  authorizer: (channel) => ({
    authorize: (socketId, callback) => {
      const token = localStorage.getItem('nepal_film_token');
      fetch('/api/broadcasting/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: new URLSearchParams({ socket_id: socketId, channel_name: channel.name }),
      })
        .then((res) => {
          if (!res.ok) throw new Error(`Channel auth failed: ${res.status}`);
          return res.json();
        })
        .then((data) => callback(false, data))
        .catch((error) => callback(true, error));
    },
  }),
});

export default echo;
