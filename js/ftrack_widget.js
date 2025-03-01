'use strict';


//  FTRACKWIDGET MODULE
 
// HANDLE COMMUNICATION WITH THE FTRACK WEB APPLICATION.
 
window.ftrackWidget = (function () {
    var credentials = null;
    var entity = null;
    var onWidgetLoadCallback, onWidgetUpdateCallback;

    // OPEN SIDEBAR FOR *ENTITYTYPE*, *ENTITYID*.
    function openSidebar(entityType, entityId) {
        console.debug('Opening sidebar', entityType, entityId);
        window.parent.postMessage({
            topic: 'ftrack.application.open-sidebar',
            data: {
                type: entityType,
                id: entityId
            }
        }, credentials.serverUrl);
    }

    //  NAVIGATE WEB APP TO *ENTITYTYPE*, *ENTITYID*
    function navigate(entityType, entityId) {
        console.debug('Navigating', entityType, entityId);
        window.parent.postMessage({
            topic: 'ftrack.application.navigate',
            data: {
                type: entityType,
                id: entityId
            }
        }, credentials.serverUrl);
    }

    // UPDATE CREDENTIALS AND ENTITY, CALL CALLBACK WHEN WIGDET LOADS
    function onWidgetLoad(content) {
        console.log('Widget loaded', content);
        credentials = content.data.credentials;
        entity = content.data.selection[0];
        if (onWidgetLoadCallback) {
            onWidgetLoadCallback(content);
            console.log(content)
            console.log("Inside Callback in Load");
        } else {
            console.log("Skipped Callback in Load");
        }
    }

    // UPDATE ENTITY AND CALL CALLBACK WHEN WIGDET IS UPDATED
    function onWidgetUpdate(content) {
        console.debug('Widget updated', content);
        entity = content.data.entity;
        if (onWidgetUpdateCallback) {
            onWidgetUpdateCallback(content);
            console.log("Inside Callback in Update");
        } else {
            console.log("Skipped Callback in Update");
        }
    }

    // HANDLE POST MESSAGES
    function onPostMessageReceived(event) {
        var content = event.data || {};
        console.debug('Got "' + content.topic + '" event.', content);

        if (content.topic === 'ftrack.widget.load') {
            //Store credentials for later.
            window.credentials = content.data.credentials;
            console.debug('STORED CREDENTIALS ARE: ', window.credentials);
            onWidgetLoad(content);
        } else if (content.topic === 'ftrack.widget.update') {
            window.entities = content.data.selection;
            console.debug('SELECTED ENTITIES ARE: ', window.entities);
            onWidgetUpdate(content);
        }

    }

    // RETURN CURRENT ENTITY
    function getEntity() {
        return entity
    }

    // RETURN API CREDENTIALS
    function getCredentials() {
        return credentials;
    }

    /**
     * Initialize module with *options*.
     *
     * Should be called after `DOMContentLoaded` has fired.
     *
     * Specify *onWidgetLoad* to receive a callback when widget has loaded.
     * Specify *onWidgetLoad* to receive a callback when widget has updated.
     */
    function initialize(options) {
        options = options || {};
        if (options.onWidgetLoad) {
            onWidgetLoadCallback = options.onWidgetLoad;
        }
        if (options.onWidgetUpdate) {
            onWidgetUpdateCallback = options.onWidgetUpdate;
        }

        // LISTEN TO POST MESSAGES.
        window.addEventListener('message', onPostMessageReceived, false);
        window.parent.postMessage({ topic: 'ftrack.widget.ready' }, '*');
    }

    // RETURN PUBLIC API
    return {
        initialize: initialize,
        getEntity: getEntity,
        getCredentials: getCredentials,
        openSidebar: openSidebar,
        navigate: navigate,
    }
}());