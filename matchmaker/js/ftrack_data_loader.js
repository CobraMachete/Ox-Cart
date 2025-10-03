'use strict';
(function (ftrack, ftrackWidget) {
	let session = null;
	let booted  = false;
	
	// Vars you referenced under 'use strict' need declarations.
	let theproduction = null;
	let theprjid      = null;
	let propName      = null;
	let thumbResFold  = null;
	
	// -------- Helpers --------
	function normalizeEntity(e) {
		if (!e) return null;
		// Already normalized?
		if (e.id && e.type) return e;
		// Selection-shaped payload { entityId, entityType }
		const id   = e.entityId || e.id || null;
		const type = e.type || e.entityType || 'TypedContext';
		return id ? { id, type } : null;
	}
	
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
		if (!opts) return;
		mergeBoot({
			teams:      opts.allteamsdata ?? null,
			structure:  opts.allstructuredata ?? null,
			projectId:  opts.projectId ?? null,
			entityId:   opts.entityId ?? null,
			objectType: opts.objectType ?? null
		});
	}
	
	function genCorrelationId() {
		return (crypto && crypto.randomUUID)
		? crypto.randomUUID()
		: (Math.random().toString(36).slice(2) + Date.now());
	}
	
	// -------- Event Hub handshake --------
	async function bootSeedViaEventHub(jsSession, rawEntity) {
		const entity = normalizeEntity(rawEntity);
		const eid = entity?.id;
		if (!eid) {
			console.warn('[MatchMaker] No entity id found for seed request:', rawEntity);
			return;
		}
		
		const correlationId = genCorrelationId();
		
		// 1) Subscribe FIRST so we cannot miss the server reply.
		await jsSession.event_hub.subscribe('topic=tntsports.matchmaker.seed', function (event) {
			const d = event && event.data || {};
			if (d.correlation_id !== correlationId) return; // only accept our reply
			if (d.entity_id !== eid) return;
			
			console.debug('[MatchMaker] seed received:', d);
			
			mergeBoot({
				teams:     d.allteamsdata || null,
				structure: d.allstructuredata || null,
				projectId: d.project_id || (window.MATCHMAKER_BOOT && window.MATCHMAKER_BOOT.projectId) || null,
				entityId:  d.entity_id || (window.MATCHMAKER_BOOT && window.MATCHMAKER_BOOT.entityId) || eid
			});
			
			// If you want to kick your UI here, do it; otherwise your existing flow can read MATCHMAKER_BOOT.
			if (typeof window.initMatchMaker === 'function') {
				window.initMatchMaker({
					teams:     window.MATCHMAKER_BOOT.teams,
					structure: window.MATCHMAKER_BOOT.structure,
					entity:    entity,
					projectId: window.MATCHMAKER_BOOT.projectId
				});
			}
		});
		
		// 2) Publish the request
		jsSession.event_hub.publish({
			topic: 'tntsports.matchmaker.request',
			data: {
				correlation_id: correlationId,
				entity_id: eid,
				// optional: project_id (server can derive from entity_id). If you have one, include it:
				project_id: (window.MATCHMAKER_BOOT && window.MATCHMAKER_BOOT.projectId) || null
			}
		});
	}
	
	// -------- Main load/update handlers --------
	async function onWidgetLoad(payload) {
		// payload provided by your ftrackWidget bridge
		const creds = (payload && payload.credentials) || (ftrackWidget.getCredentials && ftrackWidget.getCredentials());
		const opts  = (payload && payload.options)     || (ftrackWidget.getOptions && ftrackWidget.getOptions());
		const entRaw = (payload && payload.entity)     || (ftrackWidget.getEntity && ftrackWidget.getEntity());
		const entity = normalizeEntity(entRaw);
		
		// Merge any injected options (if your action ever supplies them in the future).
		hydrateFromOptions(opts);
		
		// Start session once
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
		
		// Ask server for seed (teams/structure). This is robust to CORS and options forwarding.
		await bootSeedViaEventHub(session, entity);
		
		// Then run your existing query logic (cleaned).
		await queryAndBootFromEntity(entity);
	}
	
	function onWidgetUpdate() {
		const entRaw = (ftrackWidget.getEntity && ftrackWidget.getEntity());
		const entity = normalizeEntity(entRaw);
		void queryAndBootFromEntity(entity);
	}
	
	// -------- Your original query logic, cleaned/guarded --------
	async function queryAndBootFromEntity(entity) {
		if (!session) return;
		const eid   = entity?.id;
		const etype = entity?.type || 'TypedContext';
		if (!eid) {
			console.warn('[MatchMaker] Missing entity id in queryAndBootFromEntity:', entity);
			return;
		}
		
		console.debug('[MatchMaker] Querying new data for entity', { id: eid, type: etype });
		
		try {
			const entNameRequest = session.query(
				`select id, name, parent from ${etype} where id is "${eid}" limit 1`
			);
			const prjRequest = session.query(
				`select project.id, project.name from ${etype} where id is "${eid}" limit 1`
			);
			const prjNameSearch = session.query(
				`select ancestors from ${etype} where id is "${eid}" limit 1`
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
			
			const checkParent = entRow?.parent?.__entity_type__;
			let normalizedEntity = entity;
			
			if (checkParent === 'Show_package') {
				theproduction = entRow.id; // we selected id above
				theprjid      = prjRow.project_id ?? prjRow.project?.id ?? null;
				propName      = ancRow.ancestors?.[0]?.name ?? null;
				
				window.SESSION_ENTITY = entity;
				console.log('The current entity is', entity);
				
			} else if (checkParent === 'Production') {
				theproduction = entRow.parent?.id ?? null;
				theprjid      = prjRow.project_id ?? prjRow.project?.id ?? null;
				propName      = ancRow.ancestors?.[0]?.name ?? null;
				
				selected_shot_name = entRow.name;
				
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
			
			// Your existing UI hooks — optional-chained so this file doesn’t crash if they’re not defined yet.
			window.updateInitShotname?.(selected_shot_name);
			window.ddFromCurrProp?.(propName);
			window.buildThumbList?.(propName);
			
			if (selected_shot_name !== 'None') {
				window.injectShotName?.();
			}
			
			// Thumbnails lookup (requires ADMIN project id)
			const adminPrjId = window.ADMIN_PRJ_ID;
			if (adminPrjId) {
				const theworkingprjname  = (prjRow.project?.name || '').toLowerCase();
				const theworkingpropname = (propName || '').toLowerCase();
				const resthumbfoldermain = '_thumbnails';
				
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
				console.debug('[MatchMaker] ADMIN_PRJ_ID not set; skipping thumbnail folder lookup.');
			}
			
			booted = true;
			
		} catch (err) {
			console.error('[MatchMaker] Error during queryAndBootFromEntity:', err);
		}
	}
	
	// -------- Wire up --------
	function onDomContentLoaded() {
		console.debug('DOM content loaded, initializing widget.');
		ftrackWidget.initialize({
			onWidgetLoad,
			onWidgetUpdate
		});
	}
	
	window.addEventListener('DOMContentLoaded', onDomContentLoaded);
}(window.ftrack, window.ftrackWidget));
