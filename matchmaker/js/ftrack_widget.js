'use strict';
(function debugSeed() {
  console.log('[Widget boot] href:', location.href);
  const p = Object.fromEntries(new URLSearchParams(location.hash.slice(1)));
  console.log('[Widget boot] hash params:', p);

  window.addEventListener('message', (e) => {
    // You should see credentials + selection here
    if (e?.data?.topic === 'ftrack.widget.load') {
      console.log('[Widget boot] ftrack.widget.load payload:', e.data);
    }
  });
})();

//  FTRACKWIDGET MODULE
//  Handles communication with the ftrack web app via postMessage.
window.ftrackWidget = (function () {
  /** @type {null | { serverUrl: string, [k:string]: any }} */
  let credentials = null;
  /** @type {null | any} */
  let entity = null;
  /** @type {any[] | null} */
  let selection = null;
  /** @type {any} */
  let options = null;

  let onWidgetLoadCallback;
  let onWidgetUpdateCallback;

  // ---- Helpers ----
  function sameOriginAsServer(urlA, urlB) {
    try {
      const a = new URL(urlA);
      const b = new URL(urlB);
      return a.origin === b.origin;
    } catch {
      return false;
    }
  }

  function normalizePayload(content) {
    // ftrack usually posts { topic, data: { credentials, selection, entity, options } }
    const data = content && content.data ? content.data : content || {};
    const creds = data.credentials || credentials;
    const sel = Array.isArray(data.selection) ? data.selection : selection || [];
    

    function normalizeEntity(e) {
    if (!e) return null;
    // Already normalized?
    if (e.id && e.type) return e;
        // Selection-shaped { entityId, entityType }
        const id = e.entityId || e.id || null;
        const type = e.type || e.entityType || 'TypedContext';
        return id ? { id, type } : null;
    }
    const ent = normalizeEntity(
        data.entity || (sel && sel.length ? sel[0] : entity)
    );

    // Prefer standard 'options'; fall back to your older 'custom_payload' if present.
    const opts = data.options != null ? data.options : (data.custom_payload || options);

    return { credentials: creds, selection: sel, entity: ent, options: opts };
  }

  // ---- Public actions ----
  function openSidebar(entityType, entityId) {
    if (!credentials) return;
    window.parent.postMessage({
      topic: 'ftrack.application.open-sidebar',
      data: { type: entityType, id: entityId }
    }, credentials.serverUrl);
  }

  function navigate(entityType, entityId) {
    if (!credentials) return;
    window.parent.postMessage({
      topic: 'ftrack.application.navigate',
      data: { type: entityType, id: entityId }
    }, credentials.serverUrl);
  }

  // ---- Event handlers ----
  function onWidgetLoad(content) {
    const payload = normalizePayload(content);
    credentials = payload.credentials || credentials;
    selection  = payload.selection || selection;
    entity     = payload.entity || entity;
    options    = payload.options != null ? payload.options : options;

    console.debug('Widget loaded (normalized):', payload);

    if (onWidgetLoadCallback) {
      // Pass a tidy object to your app code:
      onWidgetLoadCallback(payload);
    }
  }

  function onWidgetUpdate(content) {
    const payload = normalizePayload(content);
    // On update, ftrack may send a new selection/entity; options may or may not be re-sent.
    selection  = payload.selection || selection;
    entity     = payload.entity || entity;
    if (payload.options != null) options = payload.options;

    console.debug('Widget updated (normalized):', payload);

    if (onWidgetUpdateCallback) {
      onWidgetUpdateCallback(payload);
    }
  }

  function onPostMessageReceived(event) {
    const content = event.data || {};
    // Basic sanity
    if (!content || typeof content !== 'object' || !content.topic) return;

    // After first load, enforce origin checks
    if (credentials && credentials.serverUrl) {
      if (!sameOriginAsServer(event.origin, credentials.serverUrl)) {
        // Ignore messages not from ftrack
        return;
      }
    } else {
      // Before first load we can’t verify origin; we accept the first ftrack message.
    }

    console.debug(`Got "${content.topic}" event.`, content);

    if (content.topic === 'ftrack.widget.load') {
      onWidgetLoad(content);
    } else if (content.topic === 'ftrack.widget.update') {
      onWidgetUpdate(content);
    }
  }

  // ---- Accessors ----
  function getEntity() { return entity; }
  function getCredentials() { return credentials; }
  function getOptions() { return options; }

  /**
   * Initialize module with *options*.
   * options.onWidgetLoad(payload)
   * options.onWidgetUpdate(payload)
   */
  function initialize(initOptions) {
    initOptions = initOptions || {};
    if (initOptions.onWidgetLoad) onWidgetLoadCallback = initOptions.onWidgetLoad;
    if (initOptions.onWidgetUpdate) onWidgetUpdateCallback = initOptions.onWidgetUpdate;

    // Listen to postMessage from ftrack
    window.addEventListener('message', onPostMessageReceived, false);

    // Announce ready (use '*' until we learn serverUrl)
    window.parent.postMessage({ topic: 'tntsports.widget.ready' }, '*');
    window.parent.postMessage({ topic: 'ftrack.widget.ready' }, '*');
  }

  return {
    initialize,
    getEntity,
    getCredentials,
    getOptions,
    openSidebar,
    navigate
  };
}());
