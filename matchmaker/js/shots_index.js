'use strict';
(function (ftrack, ftrackWidget) {
  let session = null;
  let booted = false;

  // Vars you referenced under 'use strict' need declarations.
  let theproduction = null;
  let theprjid = null;
  let propName = null;
  let thumbResFold = null;

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
  }

  function hydrateFromOptions(opts) {
    const teams = opts?.allteamsdata || null;
    const structure = opts?.allstructuredata || null;

    // Optional helpers provided by your Python action.
    const projectId = opts?.projectId || null;
    const entityId  = opts?.entityId  || null;
    const objectType = opts?.objectType || null;

    mergeBoot({ teams, structure, projectId, entityId, objectType });

    if (!teams || !structure) {
      console.warn(
        '[MatchMaker] options missing teams/structure; will fall back to URL hash or other sources.',
        { hasTeams: !!teams, hasStructure: !!structure, opts }
      );
    } else {
      console.debug('[MatchMaker] options hydrated.');
    }
  }

  // ---------- URL-hash seeding (Option A fallback) ----------
  function getHashParams() {
    const out = {};
    const hash = (location.hash || '').replace(/^#/, '');
    if (!hash) return out;
    for (const part of hash.split('&')) {
      if (!part) continue;
      const [k, v] = part.split('=');
      if (k) out[decodeURIComponent(k)] = decodeURIComponent(v || '');
    }
    return out;
  }

  async function fetchSeedFromHash() {
    const p = getHashParams();
    const teamsUrl = p.teams_url;
    const structureUrl = p.structure_url;

    let teams = null, structure = null;

    try {
      if (teamsUrl) {
        const res = await fetch(teamsUrl, { credentials: 'omit' });
        if (res.ok) teams = await res.json();
        else console.warn('[MatchMaker] teams_url fetch not ok:', res.status);
      }
      if (structureUrl) {
        const res = await fetch(structureUrl, { credentials: 'omit' });
        if (res.ok) structure = await res.json();
        else console.warn('[MatchMaker] structure_url fetch not ok:', res.status);
      }
    } catch (err) {
      console.error('[MatchMaker] Error fetching seed URLs:', err);
    }

    return {
      teams,
      structure,
      entityId:  p.entity_id  || null,
      projectId: p.project_id || null
    };
  }

  // ---------- Widget lifecycle ----------
  async function onWidgetLoad(payload) {
    // payload is { credentials, selection, entity, options } from your ftrackWidget shim
    const creds = payload?.credentials || ftrackWidget.getCredentials?.();
    const opts  = payload?.options     || ftrackWidget.getOptions?.();
    const entityFromPayload = payload?.entity || ftrackWidget.getEntity?.();

    // 1) Use options first if present.
    hydrateFromOptions(opts);

    // 2) Start ftrack session once.
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

        // 3) Fallback: pull seed from URL hash and merge (won’t override existing non-null values).
        try {
          const seed = await fetchSeedFromHash();
          if (!seed.teams || !seed.structure) {
            console.warn('[MatchMaker] Seed URLs missing or fetch failed.', { hasTeams: !!seed.teams, hasStructure: !!seed.structure });
          }
          mergeBoot(seed);
        } catch (err) {
          console.error('[MatchMaker] Error fetching seed from hash:', err);
        }
      } catch (err) {
        console.error('[MatchMaker] Failed to initialize session:', err);
        return;
      }
    }

    // 4) Your prior “update” logic runs here.
    await queryAndBootFromEntity(entityFromPayload);
  }

  // Keep updates DRY: reuse the same logic used on load.
  function onWidgetUpdate() {
    const entity = ftrackWidget.getEntity();
    void queryAndBootFromEntity(entity);
  }

  // ---------- Query logic (your previous onWidgetUpdate body, cleaned) ----------
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
      const ancRow = prjNameSearch.data ? prjNameSearch.data[0] : ancRes.data[0]; // safeguard

      const checkParent = entRow?.parent?.__entity_type__;
      let normalizedEntity = entity;

      if (checkParent === 'Show_package') {
        theproduction = entRow.id; // now guaranteed present (we selected id)
        theprjid = prjRow.project_id ?? prjRow.project?.id ?? null;
        propName = ancRow.ancestors?.[0]?.name ?? null;

        window.SESSION_ENTITY = entity;
        console.log('The current entity is', entity);

      } else if (checkParent === 'Production') {
        theproduction = entRow.parent?.id ?? null;
        theprjid = prjRow.project_id ?? prjRow.project?.id ?? null;
        propName = ancRow.ancestors?.[0]?.name ?? null;

        selected_shot_name = entRow.name;

        // Normalize to production context for downstream code
        normalizedEntity = { id: theproduction, type: 'TypedContext' };
        window.SESSION_ENTITY = normalizedEntity;
        console.log('The current entity is', normalizedEntity);
      }

      console.log('=================== THE SHOTNAME ===================');
      console.log(selected_shot_name);
      console.log('=================== THE PRODUCTION =================');
      console.log(theproduction);
      console.log('=================== THE PROJECT ROW ================');
      console.log(prjRow);
      console.log('=================== THE ANCESTORS ==================');
      console.log(ancRow);

      // Your existing UI hooks (optional chaining ensures no crash if missing)
      window.updateInitShotname?.(selected_shot_name);
      window.ddFromCurrProp?.(propName);
      window.buildThumbList?.(propName);

      if (selected_shot_name !== 'None') {
        window.injectShotName?.();
      }

      // Thumbnails lookup (new style you were using)
      const theworkingprjname = (prjRow.project?.name || '').toLowerCase();
      const theworkingpropname = (propName || '').toLowerCase();
      const resthumbfoldermain = '_thumbnails';

      const newThumbFoldSearch = session.query(
        `select descendants from Folder where project_id is "${window.ADMIN_PRJ_ID}" ` +
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

      booted = true;

    } catch (err) {
      console.error('[MatchMaker] Error during queryAndBootFromEntity:', err);
    }
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
