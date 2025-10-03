// 'use strict';
// (function (ftrack, ftrackWidget) {
//     var session = null;

//     // INITIALIZE SESSION WITH CREDENTIALS ONCE WIDGET HAS LOADED
//     function onWidgetLoad() {
//         var credentials = ftrackWidget.getCredentials();
//         console.debug(credentials);
//         session = new ftrack.Session(
//             credentials.serverUrl,
//             credentials.apiUser,
//             credentials.apiKey
//         );
       
//         console.debug('Initializing API session.');
//         session.initializing.then(function () {
//             console.debug('Session initialized');
//         });

//         onWidgetUpdate();
//     }

//     // QUERY API FOR NAME AND VERSIONS WHEN WIDGET HAS LOADED
//     function onWidgetUpdate() {
//         var entity = ftrackWidget.getEntity();
//         console.debug('Querying new data for entity', entity);

//         // QUERY CURRENT ENTITY NAME
//         var entNameRequest = session.query(
//             'select name, parent from ' + entity.type + ' where id is "' + entity.id + '" limit 1' 
//         );

        
//         // QUERY VERSIONS PUBLISHED ON CURRENT ENTITY
//         var prjRequest = session.query(
//             'select project.id from ' + entity.type + ' where id is "' + entity.id + '" limit 1' 
//         );

//         // QUERY VERSIONS PUBLISHED ON CURRENT ENTITY
//         var prjNameSearch = session.query(
//             'select ancestors from ' + entity.type + ' where id is "' + entity.id + '" limit 1' 
//         );

        

//         // WAIT FOR BOTH REQUESTS TO FINISH, THEN UPDATE INTERFACE.
//         Promise.all([entNameRequest, prjRequest, prjNameSearch]).then(function (values) {

//             var selected_shot_name = "None";
//             var checkParent = values[0].data[0].parent.__entity_type__;

//             if (checkParent == "Show_package") {

//                 theproduction = values[0].data[0].id;
//                 theprjid = values[1].data[0].project_id;
//                 propName = values[2].data[0].ancestors[0].name;

//                 SESSION_ENTITY = entity;

//                 console.log("The current entity is", entity);

//             } else if (checkParent == "Production") {
//                 theproduction = values[0].data[0].parent.id;
//                 theprjid = values[1].data[0].project_id;
//                 propName = values[2].data[0].ancestors[0].name;

//                 selected_shot_name = values[0].data[0].name;

//                 entity = {
//                     'id': theproduction,
//                     'type': "TypedContext"
//                 }

//                 SESSION_ENTITY = entity;

//                 console.log("The current entity is", entity);
//             }
//             console.log("=======================================================    THE SHOTNAME IS:     ====================================================================");
//             console.log(selected_shot_name);
//             // theproduction = values[0].data[0].id;
//             // theprjid = values[1].data[0].project_id;
//             // propName = values[2].data[0].ancestors[0].name;
//             console.log("=======================================================    THE PRODUCTION IS:     ====================================================================");
//             console.log(theproduction);
//             console.log("=======================================================    THE PROJECT IS:     ====================================================================");
//             console.log(values[1].data[0]);
//             console.log("=======================================================    THE PROPNAME IS:     ====================================================================");
//             console.log(values[2].data[0]);

            
//             updateInitShotname(selected_shot_name);
//             ddFromCurrProp(values[2].data[0].ancestors[0].name);
//             buildThumbList(values[2].data[0].ancestors[0].name);

//             if (selected_shot_name !== "None") {
//                 injectShotName();
//             }

//             //  PATH STRUCTURE ---> ADMIN (Project) -> _RESOURCES -> Current Project (Lowercase) -> Property (Lowercase) -> _thumbnails

//             var theworkingprjname = values[1].data[0].project.name.toLowerCase();
//             var theworkingpropname = values[2].data[0].ancestors[0].name.toLowerCase();

//             var thumbfoldermain = "thumbnails";
//             var resthumbfoldermain = "_thumbnails";

//             var thumbFoldSearch = session.query(
//                 'select descendants from ' + entity.type + ' where project_id is "' + theprjid + '" and name is "' + thumbfoldermain + '" limit 1' 
//             );

//             var newThumbFoldSearch = session.query(
//                 'select descendants from Folder where project_id is "' + ADMIN_PRJ_ID + '" and parent.parent.name is "' + theworkingprjname + '" and parent.name is "' + theworkingpropname + '" and name is "' + resthumbfoldermain + '" limit 1' 
//             );

//             console.log("The current entity is", entity);
//             Promise.all([thumbFoldSearch, newThumbFoldSearch]).then(function (vals) {
                
//                 // if (vals[0].data.length !== 0) {
//                 //     thumbResFold = vals[0].data[0].id;
//                 //     console.log("=======================================================    THE OLD THUMBNAILS ARE:     ====================================================================");
//                 //     console.log(thumbResFold);
//                 // }

//                 if (vals[1].data.length !== 0) {
//                     thumbResFold = vals[1].data[0].id;
//                     console.log("=======================================================    THE NEW THUMBNAIL FOLDER ID IS:    ====================================================================");
//                     console.log(thumbResFold);
//                     console.log(vals[1].data[0])
//                 }


                
                
//             });
            
//         });
//     }

//     // INITIALIZE WIDGET ONCE DOM HAS LOADED
//     function onDomContentLoaded() {
//         console.debug('DOM content loaded, initializing widget.');
//         ftrackWidget.initialize({
//             onWidgetLoad: onWidgetLoad,
//             onWidgetUpdate: onWidgetUpdate
//         });
//     }

//     window.addEventListener('DOMContentLoaded', onDomContentLoaded);
// }(window.ftrack, window.ftrackWidget));


'use strict';
(function (ftrack, ftrackWidget) {
  let session = null;
  let booted = false;

  // Make your injected data easy to reach in the rest of your app.
  // You can change this shape to match your UI.
  function hydrateFromOptions(opts) {
    const teams = opts?.allteamsdata || null;
    const structure = opts?.allstructuredata || null;

    // Optional helpers we put into Python response.options:
    const projectId = opts?.projectId || null;
    const entityId  = opts?.entityId  || null;
    const objectType = opts?.objectType || null;

    // Stash for your app:
    window.MATCHMAKER_BOOT = {
      teams,
      structure,
      projectId,
      entityId,
      objectType
    };

    if (!teams || !structure) {
      console.warn(
        '[MatchMaker] options missing teams/structure; ' +
        'UI should handle this gracefully or fetch on-demand.',
        { teams: !!teams, structure: !!structure, opts }
      );
    } else {
      console.debug('[MatchMaker] options hydrated:', window.MATCHMAKER_BOOT);
    }
  }

  // ——————————————————————————————————————————
  // INITIALIZE SESSION WITH CREDENTIALS ONCE WIDGET HAS LOADED
  // ——————————————————————————————————————————
  async function onWidgetLoad(payload) {
    // payload is { credentials, selection, entity, options }
    const creds = payload?.credentials || ftrackWidget.getCredentials?.();
    const opts  = payload?.options     || ftrackWidget.getOptions?.();
    const entityFromPayload = payload?.entity || ftrackWidget.getEntity?.();

    // 1) Hydrate options (so your UI can immediately use teams/structure)
    hydrateFromOptions(opts);

    // 2) Spin up ftrack session (only once)
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

    // 3) (Optional) Do the same work you previously ran in onWidgetUpdate
    // You said we can ignore onWidgetUpdate for now, so we run that logic here.
    await queryAndBootFromEntity(entityFromPayload);
  }

  // ——————————————————————————————————————————
  // QUERY API FOR NAME/ANCESTORS/PROJECT ETC. (your old onWidgetUpdate logic)
  // ——————————————————————————————————————————
  async function queryAndBootFromEntity(entity) {
    if (!session) return;
    if (!entity?.type || !entity?.id) {
      console.warn('[MatchMaker] Missing entity in queryAndBootFromEntity:', entity);
      return;
    }

    console.debug('[MatchMaker] Querying new data for entity', entity);

    try {
      const entNameRequest = session.query(
        `select name, parent from ${entity.type} where id is "${entity.id}" limit 1`
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

      const checkParent = entRow?.parent?.__entity_type__;
      let theproduction, theprjid, propName;

      if (checkParent === 'Show_package') {
        theproduction = entRow.id;
        theprjid = prjRow.project_id;
        propName = ancRow.ancestors?.[0]?.name;

        window.SESSION_ENTITY = entity;
        console.log('The current entity is', entity);

      } else if (checkParent === 'Production') {
        theproduction = entRow.parent?.id;
        theprjid = prjRow.project_id;
        propName = ancRow.ancestors?.[0]?.name;

        selected_shot_name = entRow.name;

        // normalize entity to the production context for downstream code
        const normalizedEntity = { id: theproduction, type: 'TypedContext' };
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

      // Your existing UI calls
      updateInitShotname?.(selected_shot_name);
      ddFromCurrProp?.(propName);
      buildThumbList?.(propName);

      if (selected_shot_name !== 'None') {
        injectShotName?.();
      }

      // Thumbnails lookups (unchanged)
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
        window.thumbResFold = vals[0].data[0].id;
        console.log('==== THE NEW THUMBNAIL FOLDER ID IS: ====');
        console.log(window.thumbResFold);
        console.log(vals[0].data[0]);
      }

      // Mark boot complete
      booted = true;

    } catch (err) {
      console.error('[MatchMaker] Error during queryAndBootFromEntity:', err);
    }
  }

  // ——————————————————————————————————————————
  // (Optional) Keep a no-op onWidgetUpdate to match your existing initialize usage.
  // ——————————————————————————————————————————
  function onWidgetUpdate() {
        var entity = ftrackWidget.getEntity();
        console.debug('Querying new data for entity', entity);

        // QUERY CURRENT ENTITY NAME
        var entNameRequest = session.query(
            'select name, parent from ' + entity.type + ' where id is "' + entity.id + '" limit 1' 
        );

        
        // QUERY VERSIONS PUBLISHED ON CURRENT ENTITY
        var prjRequest = session.query(
            'select project.id from ' + entity.type + ' where id is "' + entity.id + '" limit 1' 
        );

        // QUERY VERSIONS PUBLISHED ON CURRENT ENTITY
        var prjNameSearch = session.query(
            'select ancestors from ' + entity.type + ' where id is "' + entity.id + '" limit 1' 
        );

        

        // WAIT FOR BOTH REQUESTS TO FINISH, THEN UPDATE INTERFACE.
        Promise.all([entNameRequest, prjRequest, prjNameSearch]).then(function (values) {

            var selected_shot_name = "None";
            var checkParent = values[0].data[0].parent.__entity_type__;

            if (checkParent == "Show_package") {

                theproduction = values[0].data[0].id;
                theprjid = values[1].data[0].project_id;
                propName = values[2].data[0].ancestors[0].name;

                SESSION_ENTITY = entity;

                console.log("The current entity is", entity);

            } else if (checkParent == "Production") {
                theproduction = values[0].data[0].parent.id;
                theprjid = values[1].data[0].project_id;
                propName = values[2].data[0].ancestors[0].name;

                selected_shot_name = values[0].data[0].name;

                entity = {
                    'id': theproduction,
                    'type': "TypedContext"
                }

                SESSION_ENTITY = entity;

                console.log("The current entity is", entity);
            }
            console.log("=======================================================    THE SHOTNAME IS:     ====================================================================");
            console.log(selected_shot_name);
            // theproduction = values[0].data[0].id;
            // theprjid = values[1].data[0].project_id;
            // propName = values[2].data[0].ancestors[0].name;
            console.log("=======================================================    THE PRODUCTION IS:     ====================================================================");
            console.log(theproduction);
            console.log("=======================================================    THE PROJECT IS:     ====================================================================");
            console.log(values[1].data[0]);
            console.log("=======================================================    THE PROPNAME IS:     ====================================================================");
            console.log(values[2].data[0]);

            
            updateInitShotname(selected_shot_name);
            ddFromCurrProp(values[2].data[0].ancestors[0].name);
            buildThumbList(values[2].data[0].ancestors[0].name);

            if (selected_shot_name !== "None") {
                injectShotName();
            }

            //  PATH STRUCTURE ---> ADMIN (Project) -> _RESOURCES -> Current Project (Lowercase) -> Property (Lowercase) -> _thumbnails

            var theworkingprjname = values[1].data[0].project.name.toLowerCase();
            var theworkingpropname = values[2].data[0].ancestors[0].name.toLowerCase();

            var thumbfoldermain = "thumbnails";
            var resthumbfoldermain = "_thumbnails";

            var thumbFoldSearch = session.query(
                'select descendants from ' + entity.type + ' where project_id is "' + theprjid + '" and name is "' + thumbfoldermain + '" limit 1' 
            );

            var newThumbFoldSearch = session.query(
                'select descendants from Folder where project_id is "' + ADMIN_PRJ_ID + '" and parent.parent.name is "' + theworkingprjname + '" and parent.name is "' + theworkingpropname + '" and name is "' + resthumbfoldermain + '" limit 1' 
            );

            console.log("The current entity is", entity);
            Promise.all([thumbFoldSearch, newThumbFoldSearch]).then(function (vals) {
                
                // if (vals[0].data.length !== 0) {
                //     thumbResFold = vals[0].data[0].id;
                //     console.log("=======================================================    THE OLD THUMBNAILS ARE:     ====================================================================");
                //     console.log(thumbResFold);
                // }

                if (vals[1].data.length !== 0) {
                    thumbResFold = vals[1].data[0].id;
                    console.log("=======================================================    THE NEW THUMBNAIL FOLDER ID IS:    ====================================================================");
                    console.log(thumbResFold);
                    console.log(vals[1].data[0])
                }


                
                
            });
            
        });
  }

  // INITIALIZE WIDGET ONCE DOM HAS LOADED
  function onDomContentLoaded() {
    console.debug('DOM content loaded, initializing widget.');
    ftrackWidget.initialize({
      // IMPORTANT: our ftrackWidget calls this with the normalized payload
      onWidgetLoad,
      onWidgetUpdate
    });
  }

  window.addEventListener('DOMContentLoaded', onDomContentLoaded);
}(window.ftrack, window.ftrackWidget));
