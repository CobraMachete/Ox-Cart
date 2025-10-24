'use strict';
(function (ftrack, ftrackWidget) {
  let session = null;
  let booted  = false;

  // Vars you referenced under 'use strict' need declarations.
  let theproduction = null;
  let theprjid      = null;
  let propName      = null;
  let thumbResFold  = null;

  // ---------- Seed bus: promise + event + callback registry ----------
  const __seedListeners = new Set();
  if (!window.MATCHMAKER_SEED) {
    window.MATCHMAKER_SEED = new Promise(resolve => { window.__resolveMatchmakerSeed = resolve; });
  }
  window.onMatchMakerSeedReady = (fn) => {
    if (typeof fn !== 'function') return;
    __seedListeners.add(fn);
    if (window.MATCHMAKER_BOOT?.teams && window.MATCHMAKER_BOOT?.structure) {
      try { fn(structuredClone?.(window.MATCHMAKER_BOOT) || JSON.parse(JSON.stringify(window.MATCHMAKER_BOOT))); } catch {}
    }
  };
  window.getMatchMakerSeed = () => (
    window.MATCHMAKER_BOOT ? (structuredClone?.(window.MATCHMAKER_BOOT) || JSON.parse(JSON.stringify(window.MATCHMAKER_BOOT))) : null
  );
  function __notifySeedReady() {
    const payload = window.getMatchMakerSeed();
    if (!payload) return;
    window.dispatchEvent(new CustomEvent('matchmaker:seed', { detail: payload }));
    if (window.__resolveMatchmakerSeed) { window.__resolveMatchmakerSeed(payload); window.__resolveMatchmakerSeed = null; }
    for (const fn of __seedListeners) { try { fn(payload); } catch (e) { console.error('[MatchMaker] seed listener failed:', e); } }
  }

  // ---------- Boot state helpers ----------
  function mergeBoot(partial) {
    if (!partial) return;
    const prev = window.MATCHMAKER_BOOT || {};
    window.MATCHMAKER_BOOT = {
      teams:      partial.teams      ?? prev.teams ?? null,
      structure:  partial.structure  ?? prev.structure ?? null,
      projectId:  partial.projectId  ?? prev.projectId ?? null,
      entityId:   partial.entityId   ?? prev.entityId ?? null,
      objectType: partial.objectType ?? prev.objectType ?? null
    };
    console.debug('[MatchMaker] boot merged:', window.MATCHMAKER_BOOT);

    if (window.MATCHMAKER_BOOT.teams && window.MATCHMAKER_BOOT.structure) {
      __notifySeedReady();
    }
  }

  // ---------- Hash helpers ----------
  function getHashParams() {
    const out = {};
    const raw = (location.hash || '').replace(/^#/, '');
    if (!raw) return out;
    for (const part of raw.split('&')) {
      if (!part) continue;
      const [k, v] = part.split('=');
      if (!k) continue;
      out[decodeURIComponent(k)] = decodeURIComponent(v || '');
    }
    return out;
  }

  // ---------- JSON fetch helpers ----------
  async function tryFetchJson(url) {
    if (!url) return null;
    try {
      const res = await fetch(url, { credentials: 'omit' });
      if (!res.ok) {
        console.warn('[MatchMaker] fetch not ok:', url, res.status);
        return null;
      }
      // Try JSON first; if that fails (wrong content-type), fallback to text->JSON
      try {
        return await res.json();
      } catch {
        const txt = await res.text();
        try { return JSON.parse(txt); }
        catch (e) {
          console.warn('[MatchMaker] response not JSON:', url, e);
          return null;
        }
      }
    } catch (e) {
      console.warn('[MatchMaker] fetch failed:', url, e);
      return null;
    }
  }

  // ---------- Component URL resolution (raw location) ----------
  async function resolveComponentUrlViaApi(compId) {
    if (!session || !compId) return null;
    try {
      const q = `select id, component_locations.url.value from Component where id is "${compId}" limit 1`;
      const r = await session.query(q);
      const row  = r?.data?.[0];
      const locs = row?.component_locations || [];
      const firstUrl =
        (Array.isArray(locs) && locs.length && locs[0]?.url?.value) ? locs[0].url.value :
        row?.['component_locations.url.value'] || null;

      if (!firstUrl) {
        console.warn('[MatchMaker] No component_locations.url.value for component', compId);
        return null;
      }
      console.debug('[MatchMaker] raw location URL resolved:', firstUrl);
      return firstUrl;
    } catch (err) {
      console.error('[MatchMaker] resolveComponentUrlViaApi error for', compId, err);
      return null;
    }
  }

  // ---------- Component URL resolution (server-proxy) ----------
  let __serverLocationId = null;

  async function getServerLocationId() {
    if (__serverLocationId) return __serverLocationId;
    const r = await session.query('select id, name from Location where name is "ftrack.server" limit 1');
    const row = r?.data?.[0];
    if (row?.id) {
      __serverLocationId = row.id;
      return __serverLocationId;
    }
    console.warn('[MatchMaker] Could not resolve ftrack.server location id.');
    return null;
  }

  async function callApiMaybe(path) {
    // Try with and without leading slash (older/newer servers differ)
    const variants = path.startsWith('/api/')
      ? [path, path.slice(1)]
      : [`/${path}`, path];
    for (const p of variants) {
      try {
        const res = await session.call('GET', p);
        return res;
      } catch (e) {
        // keep trying
      }
    }
    throw new Error('All API path variants failed for ' + path);
  }

  async function resolveComponentUrlViaServerProxy(componentId) {
    const locId = await getServerLocationId();
    if (!locId || !componentId) return null;

    const candidates = [
      `/api/locations/${locId}/components/${componentId}/download-url`,
      `/api/locations/${locId}/components/${componentId}/signed-url`,
      `/api/components/${componentId}/download-url`
    ];

    for (const path of candidates) {
      try {
        const res = await callApiMaybe(path);
        const url = res?.url || res?.data?.url;
        if (url) {
          console.debug('[MatchMaker] server-proxy URL resolved via', path, '→', url);
          return url;
        }
      } catch {
        // try next
      }
    }
    console.warn('[MatchMaker] No server-proxy URL for component', componentId);
    return null;
  }

  // ---------- Load seed via hash + proxy/locations ----------
  async function loadSeedDataFromHashAndApi() {
    const hp = getHashParams();
    console.debug('[MatchMaker] hash params:', hp);

    // Prefer direct URLs (may 403 due to CORS or expire)
    let teams     = await tryFetchJson(hp.teams_url);
    let structure = await tryFetchJson(hp.structure_url);

    // Try server-proxy (recommended)
    if (!teams && hp.teams_comp) {
      const proxied = await resolveComponentUrlViaServerProxy(hp.teams_comp);
      if (proxied) teams = await tryFetchJson(proxied);
    }
    if (!structure && hp.struct_comp) {
      const proxied = await resolveComponentUrlViaServerProxy(hp.struct_comp);
      if (proxied) structure = await tryFetchJson(proxied);
    }

    // Fallback: raw component location URL (may still 403)
    if (!teams && hp.teams_comp) {
      const raw = await resolveComponentUrlViaApi(hp.teams_comp);
      if (raw) teams = await tryFetchJson(raw);
    }
    if (!structure && hp.struct_comp) {
      const raw = await resolveComponentUrlViaApi(hp.struct_comp);
      if (raw) structure = await tryFetchJson(raw);
    }

    if (!teams || !structure) {
      console.warn('[MatchMaker] Seed still incomplete after URL/server-proxy/raw attempts.', {
        hasTeams: !!teams, hasStructure: !!structure, hash: hp
      });
    } else {
      console.debug('[MatchMaker] Seed loaded.');
    }

    mergeBoot({
      teams,
      structure,
      entityId:  hp.entity_id  || (window.MATCHMAKER_BOOT && window.MATCHMAKER_BOOT.entityId) || null,
      projectId: hp.project_id || (window.MATCHMAKER_BOOT && window.MATCHMAKER_BOOT.projectId) || null
    });
  }

  // ---------- Helpers for safer derivation ----------
  function derivePropName(ancRow, entRow) {
    const ancestors = ancRow?.ancestors || [];
    if (!Array.isArray(ancestors) || !ancestors.length) return null;

    const preferred = ancestors.find(a => {
      const t = a?.object_type?.name;
      return t === 'Property' || t === 'Production' || t === 'Show_Package' || t === 'Show_package';
    });
    if (preferred?.name) return preferred.name;

    for (let i = ancestors.length - 1; i >= 0; i--) {
      const n = ancestors[i]?.name;
      if (n) return n;
    }
    return entRow?.name || null;
  }

  // ---------- Query logic (previous onWidgetUpdate body, hardened) ----------
  async function queryAndBootFromEntity(entity) {
    if (!session) return;
    if (!entity?.type || !entity?.id) {
      console.warn('[MatchMaker] Missing entity in queryAndBootFromEntity:', entity);
      return;
    }

    console.debug('[MatchMaker] Querying new data for entity', entity);

    try {
      const entNameRequest = session.query(
        `select id, name, parent from ${entity.type} where id is "${entity.id}" limit 1`
      );
      const prjRequest = session.query(
        `select project.id, project.name from ${entity.type} where id is "${entity.id}" limit 1`
      );
      const prjNameSearch = session.query(
        `select ancestors from ${entity.type} where id is "${entity.id}" limit 1`
      );

      const [entNameRes, prjRes, ancRes] = await Promise.all([
        entNameRequest, prjRequest, prjNameSearch
      ]);

      if (!entNameRes?.data?.length || !prjRes?.data?.length || !ancRes?.data?.length) {
        console.warn('[MatchMaker] One or more queries returned no data.', {
          entNameRes, prjRes, ancRes
        });
        return;
      }

      let selected_shot_name = 'None';
      const entRow = entNameRes.data[0];
      const prjRow = prjRes.data[0];
      const ancRow = ancRes.data[0];

      propName = derivePropName(ancRow, entRow);

      const parentType = entRow?.parent?.__entity_type__;
      let normalizedEntity;

      const isShowPackage = (parentType === 'Show_package' || parentType === 'Show_Package');
      const isProduction  = (parentType === 'Production');

      if (isShowPackage) {
        theproduction = entRow.id;
        theprjid      = prjRow.project_id ?? prjRow.project?.id ?? null;

        window.SESSION_ENTITY = entity;
        console.log('The current entity is', entity);

      } else if (isProduction) {
        theproduction = entRow.parent?.id ?? null;
        theprjid      = prjRow.project_id ?? prjRow.project?.id ?? null;

        selected_shot_name = entRow.name;

        normalizedEntity = { id: theproduction, type: 'TypedContext' };
        window.SESSION_ENTITY = normalizedEntity;
        console.log('The current entity is', normalizedEntity);
      } else {
        console.warn('[MatchMaker] Unhandled parent type:', parentType);
        window.SESSION_ENTITY = entity;
      }

      console.log('=================== THE SHOTNAME ===================');
      console.log(selected_shot_name);
      console.log('=================== THE PRODUCTION =================');
      console.log(theproduction);
      console.log('=================== THE PROJECT ROW ================');
      console.log(prjRow);
      console.log('=================== THE ANCESTORS ==================');
      console.log(ancRow);
      console.log('=================== DERIVED PROP NAME ==============');
      console.log(propName);

      if (typeof window.updateInitShotname === 'function') {
        window.updateInitShotname(selected_shot_name);
      }

      if (propName) {
        // window.ddFromCurrProp?.(propName);
        // window.buildThumbList?.(propName);
      } else {
        console.warn('[MatchMaker] No propName derived; skipping ddFromCurrProp/buildThumbList.');
      }

      if (selected_shot_name !== 'None') {
        window.injectShotName?.();
      }

      const adminPrjId = window.ADMIN_PRJ_ID;
      if (adminPrjId) {
        const theworkingprjname  = (prjRow.project?.name || '').toLowerCase();
        const theworkingpropname = (propName || '').toLowerCase();
        const resthumbfoldermain = '_thumbnails';

        if (theworkingprjname && theworkingpropname) {
          const newThumbFoldSearch = session.query(
            `select descendants from Folder where project_id is "${adminPrjId}" ` +
            `and parent.parent.name is "${theworkingprjname}" ` +
            `and parent.name is "${theworkingpropname}" ` +
            `and name is "${resthumbfoldermain}" limit 1`
          );

          const vals = await Promise.all([newThumbFoldSearch]);
          if (vals[0]?.data?.length) {
            thumbResFold = vals[0].data[0].id;
            console.log('==== THE NEW THUMBNAIL FOLDER ID IS: ====');
            console.log(thumbResFold);
            console.log(vals[0].data[0]);
          }
        } else {
          console.debug('[MatchMaker] Missing working project/property names; skip thumbnail lookup.');
        }
      } else {
        console.debug('[MatchMaker] ADMIN_PRJ_ID not set; skipping thumbnail folder lookup.');
      }

      booted = true;

    } catch (err) {
      console.error('[MatchMaker] Error during queryAndBootFromEntity:', err);
    }
  }

  // ---------- Widget lifecycle ----------
  async function onWidgetLoad(payload) {
    const creds  = payload?.credentials || ftrackWidget.getCredentials?.();
    const entity = payload?.entity      || ftrackWidget.getEntity?.();

    if (!session) {
      if (!creds?.serverUrl || !creds?.apiUser || !creds?.apiKey) {
        console.error('[MatchMaker] Missing credentials; cannot init ftrack session.', creds);
        return;
      }
      console.debug('[MatchMaker] Initializing API session…', creds.serverUrl);
      session = new ftrack.Session(creds.serverUrl, creds.apiUser, creds.apiKey);
      try {
        await session.initializing;
        console.debug('[MatchMaker] Session initialized.');
      } catch (err) {
        console.error('[MatchMaker] Failed to initialize session:', err);
        return;
      }
    }

    // Load seed via hash + proxy/locations
    await loadSeedDataFromHashAndApi();

    // Then run your existing query logic
    await queryAndBootFromEntity(entity);
  }

  function onWidgetUpdate() {
    const entity = ftrackWidget.getEntity();
    void queryAndBootFromEntity(entity);
  }

  // ---------- Wire up ----------
  function onDomContentLoaded() {
    console.debug('DOM content loaded, initializing widget.');
    ftrackWidget.initialize({
      onWidgetLoad,
      onWidgetUpdate
    });
  }

  window.addEventListener('DOMContentLoaded', onDomContentLoaded);
}(window.ftrack, window.ftrackWidget));
