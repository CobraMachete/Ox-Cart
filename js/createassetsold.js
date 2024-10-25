function createShotAndTasks() {

    var mayaType = "c53970b0-ecbe-433d-a307-b8477d7e7c5a";
    var c4dType = "e543387d-6f3f-4184-8da3-34225139c643";
    var maxType = "ced440d9-9851-4165-ac40-fe0a4aa290b8";
    var cmpType = "44dd23b6-4164-11df-9218-0019bb4983d8";
    var templateType = "e88adbd1-851f-415f-bc63-214d22bfc3b9";

    var cmpTaskErrs = [];
    var thrDTaskErrs = [];

    var compPromise, thrDPromise;

    var creds = window.credentials;
    console.debug(creds);

    session = new ftrack.Session(
        creds.serverUrl,
        creds.apiUser,
        creds.apiKey
    );

    //BOOLES FOR TOGGLES
    var isCompElement = false;
    var is3DElement = false;
    var isTeamsObj = false;
    var hasShotNumbering = false;

    //SHOT NAME FROM UI
    var shotNameField = document.getElementById("searchbar");
    var currShotName = shotNameField.value;

    //TEAMS OBJ NAME FROM UI
    var teamsObjField = document.getElementById("standalonefield");
    var teamsObjName = teamsObjField.value;
    

    var cmptggle = document.getElementById("compswitch");
    var threedtggle = document.getElementById("threedswitch");
    var stndtggle = document.getElementById("standaloneswitch");

    var compTbl = document.getElementById("comptablebody");
    var thrdTbl = document.getElementById("threedtablebody");

    var theshots = document.getElementById("threedshots");
    var shotchildren = [];


    var cmpTaskList = [];
    var thrDTaskList = [];

    if (cmptggle.classList.contains("toggle-on")) {
        
        isCompElement = true;

        for (var i = 0; i < compTbl.rows.length; i++) {
            var currrow = compTbl.rows[i];
            var rowinpt = currrow.children[0].children[0].value;
            cmpTaskList.push(rowinpt)
        }
    }

    if (threedtggle.classList.contains("toggle-on")) {

        is3DElement = true;

        //BUILD ARRAY OF CLASSLIST FOR NUMBERING SYSTEM
        for (var j = 1; j < theshots.children.length; j++) {
            shotchildren.push(theshots.children[j].classList);
        }

        //SET TO TRUE IS ONE OF CLASSLIST IS SHOTNUMSELECT
        for (var l=0; l < shotchildren.length; l++) {
            if (shotchildren[l].contains("shotnumselect")) {
                hasShotNumbering = true;
            }
        }

        //ALGO IF SHOTS ARE NEEDED
        if (hasShotNumbering == true) {

            for (var i = 0; i < thrdTbl.rows.length; i++) {

                var currrow = thrdTbl.rows[i];
                var rowinptbase = currrow.children[0].children[0].value;
                
                for (var k=0; k < shotchildren.length; k++) {
                    if (shotchildren[k].contains("shotnumselect")) {
                        var rowinpt = rowinptbase + "_SHOT_00" + (k+1);
                        thrDTaskList.push(rowinpt);
                    }
                }

                
            }
        
        //ALGO IF NO SHOTS
        } else {

            for (var i = 0; i < thrdTbl.rows.length; i++) {
                var currrow = thrdTbl.rows[i];
                var rowinpt = currrow.children[0].children[0].value;
                thrDTaskList.push(rowinpt)
            }
        }

        
    }

    if (stndtggle.classList.contains("toggle-on")) {
        isTeamsObj = true;
    }

    var entity = ftrackWidget.getEntity();
    console.log(currShotName)

    //CREATE SHOT FOLDER
    var shotPromise = createShot(entity, theprjid, currShotName)
        .then(newEnt => {

            console.log(newEnt);

            //CHECKING IF COMP TASKS ARE CHECKED
            if (isCompElement == true) {
                createCmpFold(newEnt.data.id, theprjid, "02_cmp")
                    .then(cmpFoldEnt => {

                        console.log(cmpFoldEnt);

                        //CHECKING IF TEAMS OBJ IS CHECKED
                        if (isTeamsObj == true) {
                            createTeamObj(cmpFoldEnt.data.id, theprjid, teamsObjName)
                                .then(teamObjEnt => {

                                    //COMP TASK LOOP FOR TEAMS OBJECT
                                    processCompTasks(cmpTaskList, teamObjEnt, theprjid, cmpType);

                                    console.log(cmpTaskErrs);
                                    
                                }).catch((err) => {
                                    console.log(err);
                                    
                                });

                        } else {

                            //COMP TASK LOOP FOR FOLDER
                            processCompTasks(cmpTaskList, cmpFoldEnt, theprjid, cmpType);

                            console.log(cmpTaskErrs);
                        }

                    }).catch((err) => {
                        console.log(err);
                    });
            } else {
                compItemsFinished = true;
            }

            //CHECKING IF 3D TASKS ARE CHECKED
            if (is3DElement == true) {
                create3DFold(newEnt.data.id, theprjid, "00_3D")
                    .then(thrDFoldEnt => {

                        console.log(thrDFoldEnt);

                        //CHECKING IF TEAMS OBJ IS CHECKED
                        if (isTeamsObj == true) {
                            createTeamObj(thrDFoldEnt.data.id, theprjid, teamsObjName)
                                .then(teamObjEnt => {

                                    //COMP TASK LOOP FOR TEAMS OBJECT
                                    process3DTasks(thrDTaskList, teamObjEnt, theprjid, c4dType);

                                    console.log(thrDTaskErrs);
                                    
                                }).catch((err) => {
                                    console.log(err);
                                    
                                });
                                
                        } else {

                            //3D TASK LOOP FOR FOLDER
                            process3DTasks(thrDTaskList, thrDFoldEnt, theprjid, c4dType);

                            console.log(thrDTaskErrs);
                        }

                    }).catch((err) => {
                        console.log(err);
                    });
            }

        }).catch((err) => {
            console.log(err);
        });

    Promise.all([shotPromise]).then(result => {
        console.log("MAIN PROMISE COMPLETE");
    })


}

// CREATE NEW SHOT
function createShot(entity, prjid, shotName) {

    return new Promise(function (resolve, reject) {

        session.query('select id, name from Shot where name is ' + shotName +' and parent_id is "' + entity.id + '"')
            .then(function (response) {
                if (response.length > 0) {
                    console.log('Shot already exists.');
                    reject('Shot already exists.');
                }

                // Fetch the entity (project, shot, or folder) you want to add the folder to
                session.query('select id, name from TypedContext where id is "' + entity.id + '"')
                    .then(function (entityResponse) {
                        
                        if (entityResponse.length === 0) {
                            console.error('Entity not found.');
                            reject('Entity not found.');
                        }

                        const entity = entityResponse.data[0];

                        // CREATE NEW SHOT
                        const newShot = session.create('Shot', {
                            name: shotName,
                            parent_id: entity.id,
                            project_id: prjid,
                        }).then(function (res) {
                            
                            resolve(res);
                            

                            // Commit the changes to save the folder
                            // session.update()
                            // .then(function (result) {
                            //     console.log('Shot created successfully:', result);
                            // })
                            // .catch(function (error) {
                            //     console.error('Error creating shot:', error);
                            // });
                        });
                        
                    })
                    .catch(function (error) {
                        console.error('Error fetching entity:', error);
                        reject('Error fetching entity:', error);
                    });

            })
            .catch(function (error) {
                console.error('Error querying shot:', error);
                reject('Error querying shot:', error);
            });

    });

    

}

// CREATE NEW COMP FOLDER
function createCmpFold(shotEntId, prjid, foldName) {

    return new Promise(function (resolve, reject) {

        session.query('select id, name from Folder where name is ' + foldName +' and parent_id is "' + shotEntId + '"')
            .then(function (response) {
                if (response.length > 0) {
                    console.log('Folder already exists.');
                    reject('Folder already exists.');
                }

                // FETCH PARENT ENTITY
                session.query('select id, name from TypedContext where id is "' + shotEntId + '"')
                    .then(function (entityResponse) {
                        
                        if (entityResponse.length === 0) {
                            console.error('Entity not found.');
                            reject('Entity not found.');
                        }

                        const entity = entityResponse.data[0];

                        // CREATE NEW SHOT
                        const newFold = session.create('Folder', {
                            name: foldName,
                            parent_id: entity.id,
                            project_id: prjid,
                        }).then(function (res) {
                            
                            resolve(res);
                            
                        });
                        
                    })
                    .catch(function (error) {
                        console.error('Error fetching entity:', error);
                        reject('Error fetching entity:', error);
                    });

            })
            .catch(function (error) {
                console.error('Error querying folder:', error);
                reject('Error querying folder:', error);
            });

    });

    

}

// CREATE NEW 3D FOLDER
function create3DFold(shotEntId, prjid, foldName) {

    return new Promise(function (resolve, reject) {

        session.query('select id, name from Folder where name is ' + foldName +' and parent_id is "' + shotEntId + '"')
            .then(function (response) {
                if (response.length > 0) {
                    console.log('Folder already exists.');
                    reject('Folder already exists.');
                }

                // FETCH PARENT ENTITY
                session.query('select id, name from TypedContext where id is "' + shotEntId + '"')
                    .then(function (entityResponse) {
                        
                        if (entityResponse.length === 0) {
                            console.error('Entity not found.');
                            reject('Entity not found.');
                        }

                        const entity = entityResponse.data[0];

                        // CREATE NEW SHOT
                        const newFold = session.create('Folder', {
                            name: foldName,
                            parent_id: entity.id,
                            project_id: prjid,
                        }).then(function (res) {
                            
                            resolve(res);
                            
                        });
                        
                    })
                    .catch(function (error) {
                        console.error('Error fetching entity:', error);
                        reject('Error fetching entity:', error);
                    });

            })
            .catch(function (error) {
                console.error('Error querying folder:', error);
                reject('Error querying folder:', error);
            });

    });

    

}

// CREATE NEW TEAMS OBJ
function createTeamObj(foldEntId, prjid, teamsName) {

    return new Promise(function (resolve, reject) {

        session.query('select id, name from Teams where name is ' + teamsName +' and parent_id is "' + foldEntId + '"')
            .then(function (response) {
                if (response.length > 0) {
                    console.log('Teams Obj already exists.');
                    reject('Teams Obj already exists.');
                }

                // FETCH PARENT ENTITY
                session.query('select id, name from TypedContext where id is "' + foldEntId + '"')
                    .then(function (entityResponse) {
                        
                        if (entityResponse.length === 0) {
                            console.error('Entity not found.');
                            reject('Entity not found.');
                        }

                        const entity = entityResponse.data[0];

                        // CREATE NEW SHOT
                        const newFold = session.create('Teams', {
                            name: teamsName,
                            parent_id: entity.id,
                            project_id: prjid,
                        }).then(function (res) {
                            
                            resolve(res);
                            
                        });
                        
                    })
                    .catch(function (error) {
                        console.error('Error fetching entity:', error);
                        reject('Error fetching entity:', error);
                    });

            })
            .catch(function (error) {
                console.error('Error querying teams object:', error);
                reject('Error querying teams object:', error);
            });

    });

    

}

// CREATE NEW COMP TASK
function createCompTask(parentEntId, prjid, currTaskName, typeid) {

    return new Promise(function (resolve, reject) {

        
        session.query('select id, name from Task where name is ' + currTaskName +' and parent_id is "' + parentEntId + '"')
        .then(function (response) {
            if (response.length > 0) {
                reject(taskErrs.push(currTaskName))
            }

            // FETCH PARENT ENTITY
            session.query('select id, name from TypedContext where id is "' + parentEntId + '"')
                .then(function (entityResponse) {
                    
                    if (entityResponse.length === 0) {
                        reject(taskErrs.push(currTaskName));
                    }

                    const entity = entityResponse.data[0];

                    // CREATE NEW SHOT
                    const newFold = session.create('Task', {
                        name: currTaskName,
                        parent_id: entity.id,
                        project_id: prjid,
                        type_id: typeid
                    }).then(function (res) {
                        
                        resolve(res);
                        
                    });
                    
                })
                .catch(function (error) {
                    console.error('Error fetching entity:', error);
                    reject(taskErrs.push(currTaskName))
                });

        })
        .catch(function (error) {
            console.error('Error querying teams object:', error);
            reject(taskErrs.push(currTaskName))
        });

    });

    

}

// CREATE NEW 3D TASK
function create3DTask(parentEntId, prjid, currTaskName, typeid) {

    return new Promise(function (resolve, reject) {

        
        session.query('select id, name from Task where name is ' + currTaskName +' and parent_id is "' + parentEntId + '"')
        .then(function (response) {
            if (response.length > 0) {
                reject(taskErrs.push(currTaskName))
            }

            // FETCH PARENT ENTITY
            session.query('select id, name from TypedContext where id is "' + parentEntId + '"')
                .then(function (entityResponse) {
                    
                    if (entityResponse.length === 0) {
                        reject(taskErrs.push(currTaskName));
                    }

                    const entity = entityResponse.data[0];

                    // CREATE NEW SHOT
                    const newFold = session.create('Task', {
                        name: currTaskName,
                        parent_id: entity.id,
                        project_id: prjid,
                        type_id: typeid
                    }).then(function (res) {
                        
                        resolve(res);
                        
                    });
                    
                })
                .catch(function (error) {
                    console.error('Error fetching entity:', error);
                    reject(taskErrs.push(currTaskName))
                });

        })
        .catch(function (error) {
            console.error('Error querying teams object:', error);
            reject(taskErrs.push(currTaskName))
        });

    });

    

}

async function processCompTasks(compArr, entOBJ, projID, tasktype) {

    for (var x=0; x < compArr.length; x++) {

        await createCompTask(entOBJ.data.id, projID, compArr[x], tasktype)
        .then(taskItemEnt => {
            console.log("Item " + taskItemEnt.data.name + " successfully added.")
        }).catch((errTask) => {
            cmpTaskErrs.push(errTask);
        });

    }
    
    console.log("ALL COMP ITEMS HAVE BEEN PROCESSED")
    
    // if (thrdItemsFinished == true){
    //     window.location.reload();
    // }

}

async function process3DTasks(thrDArr, entOBJ, projID, tasktype) {

    for (var x=0; x < thrDArr.length; x++) {

        await create3DTask(entOBJ.data.id, projID, thrDArr[x], tasktype)
        .then(taskItemEnt => {
            console.log("Item " + taskItemEnt.data.name + " successfully added.")
        }).catch((errTask) => {
            thrDTaskList.push(errTask);
        });

    }
    
    console.log("ALL 3D ITEMS HAVE BEEN PROCESSED");

    // if (compItemsFinished == true){
    //     window.location.reload();
    // }
    

}
