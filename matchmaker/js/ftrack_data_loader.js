'use strict';
(function (ftrack, ftrackWidget) {
	let session = null;
	let booted  = false;
	
	// Vars you referenced under 'use strict' need declarations.
	let theproduction = null;
	let theprjid      = null;
	let propName      = null;
	let thumbResFold  = null;
	
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
			return await res.json();
		} catch (e) {
			console.warn('[MatchMaker] fetch failed:', url, e);
			return null;
		}
	}
	
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
			return firstUrl;
		} catch (err) {
			console.error('[MatchMaker] resolveComponentUrlViaApi error for', compId, err);
			return null;
		}
	}
	
	async function loadSeedDataFromHashAndApi() {
		const hp = getHashParams();
		
		// Prefer direct URLs if present
		let teams     = await tryFetchJson(hp.teams_url);
		let structure = await tryFetchJson(hp.structure_url);
		
		// Fall back to resolving a URL via the JS API by component id
		if (!teams && hp.teams_comp) {
			const u = await resolveComponentUrlViaApi(hp.teams_comp);
			if (u) teams = await tryFetchJson(u);
		}
		if (!structure && hp.struct_comp) {
			const u = await resolveComponentUrlViaApi(hp.struct_comp);
			if (u) structure = await tryFetchJson(u);
		}
		
		if (!teams || !structure) {
			console.warn('[MatchMaker] Seed still incomplete after URL/API attempts.', {
				hasTeams: !!teams, hasStructure: !!structure, hash: hp
			});
		} else {
			console.debug('[MatchMaker] Seed loaded from URL/API.');
		}
		
		mergeBoot({
			teams,
			structure,
			entityId:  hp.entity_id  || (window.MATCHMAKER_BOOT && window.MATCHMAKER_BOOT.entityId) || null,
			projectId: hp.project_id || (window.MATCHMAKER_BOOT && window.MATCHMAKER_BOOT.projectId) || null
		});

		if (window.MATCHMAKER_BOOT.teams && window.MATCHMAKER_BOOT.structure) {
			__notifySeedReady();
		}
	}
	
	// --- Seed bus: event + promise + callback registry ---
	const __seedListeners = new Set();
	
	// Promise any script can await
	if (!window.MATCHMAKER_SEED) {
		window.MATCHMAKER_SEED = new Promise(resolve => { window.__resolveMatchmakerSeed = resolve; });
	}
	
	// Optional: register a callback (fires immediately if seed already ready)
	window.onMatchMakerSeedReady = (fn) => {
		if (typeof fn !== 'function') return;
		__seedListeners.add(fn);
		if (window.MATCHMAKER_BOOT?.teams && window.MATCHMAKER_BOOT?.structure) {
			try { fn(structuredClone?.(window.MATCHMAKER_BOOT) || JSON.parse(JSON.stringify(window.MATCHMAKER_BOOT))); } catch {}
		}
	};
	
	// Snapshot getter (read-only copy)
	window.getMatchMakerSeed = () => (
		window.MATCHMAKER_BOOT ? (structuredClone?.(window.MATCHMAKER_BOOT) || JSON.parse(JSON.stringify(window.MATCHMAKER_BOOT))) : null
	);
	
	// Internal notifier — call this once seed is complete
	function __notifySeedReady() {
		const payload = window.getMatchMakerSeed();
		if (!payload) return;
		
		// 1) fire DOM event
		window.dispatchEvent(new CustomEvent('matchmaker:seed', { detail: payload }));
		
		// 2) resolve the promise (once)
		if (window.__resolveMatchmakerSeed) { window.__resolveMatchmakerSeed(payload); window.__resolveMatchmakerSeed = null; }
		
		// 3) call any registered callbacks
		for (const fn of __seedListeners) {
			try { fn(payload); } catch (e) { console.error('[MatchMaker] seed listener failed:', e); }
		}
	}
	
	
	// ---------- Widget lifecycle ----------
	async function onWidgetLoad(payload) {
		// payload from ftrackWidget shim: { credentials, selection, entity }
		const creds  = payload?.credentials || ftrackWidget.getCredentials?.();
		const entity = payload?.entity      || ftrackWidget.getEntity?.();
		
		// Start ftrack session once (needed for API fallback)
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
		
		// Pull seed from hash (URLs) and, if needed, via API by component id
		await loadSeedDataFromHashAndApi();
		
		// Then run your existing query logic
		await queryAndBootFromEntity(entity);
	}
	
	function onWidgetUpdate() {
		const entity = ftrackWidget.getEntity();
		void queryAndBootFromEntity(entity);
	}
	
	// ---------- Helpers for safer derivation ----------
	function derivePropName(ancRow, entRow) {
		const ancestors = ancRow?.ancestors || [];
		if (!Array.isArray(ancestors) || !ancestors.length) return null;
		
		// 1) Prefer an ancestor whose object_type.name looks like a Property/Production node
		const preferred = ancestors.find(a => {
			const t = a?.object_type?.name;
			return t === 'Property' || t === 'Production' || t === 'Show_Package' || t === 'Show_package';
		});
		if (preferred?.name) return preferred.name;
		
		// 2) Otherwise, pick the last ancestor that has a name (closest in the tree)
		for (let i = ancestors.length - 1; i >= 0; i--) {
			const n = ancestors[i]?.name;
			if (n) return n;
		}
		
		// 3) Last resort: entity's own name (if available)
		return entRow?.name || null;
	}
	
	// ---------- Query logic (your previous onWidgetUpdate body, hardened) ----------
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
			
			// Robust propName derivation
			propName = derivePropName(ancRow, entRow);
			
			const parentType = entRow?.parent?.__entity_type__;
			let normalizedEntity;
			
			// Be lenient with casing of Show_package / Show_Package
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
				
				// Normalize to production context for downstream code
				normalizedEntity = { id: theproduction, type: 'TypedContext' };
				window.SESSION_ENTITY = normalizedEntity;
				console.log('The current entity is', normalizedEntity);
			} else {
				// Unknown parent type; keep SESSION_ENTITY as-is and warn
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
			
			// ---- Guarded UI calls ----
			if (typeof window.updateInitShotname === 'function') {
				window.updateInitShotname(selected_shot_name);
			}
			
			if (propName) {
				//window.ddFromCurrProp?.(propName);
				//window.buildThumbList?.(propName);
			} else {
				console.warn('[MatchMaker] No propName derived; skipping ddFromCurrProp/buildThumbList.');
			}
			
			if (selected_shot_name !== 'None') {
				window.injectShotName?.();
			}
			
			// Thumbnails lookup (requires ADMIN project id)
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
