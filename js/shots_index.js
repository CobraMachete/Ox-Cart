'use strict';
(function (ftrack, ftrackWidget) {
    var session = null;

    // INITIALIZE SESSION WITH CREDENTIALS ONCE WIDGET HAS LOADED
    function onWidgetLoad() {
        var credentials = ftrackWidget.getCredentials();
        console.debug(credentials);
        session = new ftrack.Session(
            credentials.serverUrl,
            credentials.apiUser,
            credentials.apiKey
        );
       
        console.debug('Initializing API session.');
        session.initializing.then(function () {
            console.debug('Session initialized');
        });

        onWidgetUpdate();
    }

    // QUERY API FOR NAME AND VERSIONS WHEN WIDGET HAS LOADED
    function onWidgetUpdate() {
        var entity = ftrackWidget.getEntity();
        console.debug('Querying new data for entity', entity);

        // QUERY CURRENT ENTITY NAME
        var entNameRequest = session.query(
            'select name from ' + entity.type + ' where id is "' + entity.id + '" limit 1' 
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
            theproduction = values[0].data[0].id;
            theprjid = values[1].data[0].project_id;
            propName = values[2].data[0].ancestors[0].name;
            ddFromCurrProp(values[2].data[0].ancestors[0].name);
            buildThumbList(values[2].data[0].ancestors[0].name);

            var thumbfoldermain = "thumbnails";

            var thumbFoldSearch = session.query(
                'select descendants from ' + entity.type + ' where project_id is "' + theprjid + '" and name is "' + thumbfoldermain + '" limit 1' 
            );

            Promise.all([thumbFoldSearch]).then(function (vals) {
                
                if (vals[0].data.length !== 0) {
                    thumbResFold = vals[0].data[0].id;
                }
                
            });
            
        });
    }

    // INITIALIZE WIDGET ONCE DOM HAS LOADED
    function onDomContentLoaded() {
        console.debug('DOM content loaded, initializing widget.');
        ftrackWidget.initialize({
            onWidgetLoad: onWidgetLoad,
            onWidgetUpdate: onWidgetUpdate
        });
    }

    window.addEventListener('DOMContentLoaded', onDomContentLoaded);
}(window.ftrack, window.ftrackWidget));