//GLOBAL VARS FOR CREATE
var entityCheckObj = [
	{
		shot_id: '',
		shot_name: '',
		compfolder_id: '',
		compfolder_name: '',
		threedfolder_id: '',
		threedfolder_name: '',
		teamsobjectcmp_id: '',
		teamsobjectcmp_name: '',
		teamsobjectthrd_id: '',
		teamsobjectthrd_name: '',
		multicompobjectcmp_id: '',
		multicompobjectcmp_name: '',
		multicompobjectthrd_id: '',
		multicompobjectthrd_name: '',
		
		
	}
]


var ERROR_MULTIPLE_TMS_OBJ = "MULTIPLE_TEAMS";
var ERROR_MULTIPLE_MULTICOMP_OBJ = "MULTIPLE_MULTICOMPS";
var ERROR_SHOT_EXISTS = "SHOT_EXISTS";
var ERROR_SHORT_TITLE = "ERROR: SHOT NAME TOO SHORT";
var ERROR_NOTNUM = "ERROR: SHOT NAME MUST START WITH 4 DIGITS";
var ERROR_MISSING_MULTICOMP = "ERROR: MULTICOMP OBJECT IS UNNAMED";
var ERROR_DUPE_TASK = "ERROR: DUPLICATE TASK";

//COMP AND 3D TASK ERROR LISTS
var cmpTaskErrs = [];
var thrDTaskErrs = [];

function makeNewSession() {
	let fw = window.ftrackWidget;
	
	var creds = fw.getCredentials();
	console.log(creds);
	
	session = new ftrack.Session(
		creds.serverUrl,
		creds.apiUser,
		creds.apiKey
	);
	
	return session
}

function dataPreflight(strucdata, specdata, prjid) {
	
	return new Promise(function (resolve, reject) {
		
		let collecteddata = {};
		
		if (strucdata && specdata && prjid) {
			
			collecteddata.strucdata = strucdata;
			collecteddata.specdata = specdata;
			collecteddata.prjid = prjid;
			
			resolve(collecteddata)
			
		} else {
			reject(false)
		}
		
		
	});
	
}

function rowPreflight(row) {
	
	return new Promise(function (resolve, reject) {
		
		console.log(row);
		let alldataexists = true;
		
		if (row.awaySearch === '') {
			alldataexists = false;
		}
		
		if (row.homeSearch === '') {
			alldataexists = false;
		}
		
		if (row.awayTricode === '') {
			alldataexists = false;
		}
		
		if (row.homeTricode === '') {
			alldataexists = false;
		}
		
		if (row.awaySchool === '') {
			alldataexists = false;
		}
		
		if (row.homeSchool === '') {
			alldataexists = false;
		}
		
		if (!row.currentIcon) {
			alldataexists = false;
		}
		
		if (row.calText === '') {
			alldataexists = false;
		}
		
		
		
		
		if (alldataexists === true) {
			resolve(row)
		} else {
			reject(false)
		}
		
	});
	
}

async function fieldsPreflight(rowcont) {
	
	let missingitems = [];
	
	for (var x = 0; x < rowcont.childElementCount; x++) {
		
		let row = rowcont.children[x];
		
		console.log(row);
		
		
		if (row.awaySearch === '') {
			let missels = { "rowid": row.id, "element": '#awaysearchbar'};
			missingitems.push(missels)
			
		}
		
		if (row.homeSearch === '') {
			let missels = { "rowid": row.id, "element": '#homesearchbar'};
			missingitems.push(missels)
		}
		
		if (row.awayTricode === '') {
			let missels = { "rowid": row.id, "element": '#tricode-row-away'};
			missingitems.push(missels)
		}
		
		if (row.homeTricode === '') {
			let missels = { "rowid": row.id, "element": '#tricode-row-home'};
			missingitems.push(missels)
		}
		
		if (row.awaySchool === '') {
			let missels = { "rowid": row.id, "element": '#school-row-away'};
			missingitems.push(missels)
		}
		
		if (row.homeSchool === '') {
			let missels = { "rowid": row.id, "element": '#school-row-home'};
			missingitems.push(missels)
		}
		
		
		if (row.calText === '') {
			let missels = { "rowid": row.id, "element": '#cal-text-input'};
			missingitems.push(missels)
		}
		
	}
	console.log(missingitems);
	return missingitems
	
}

function shotPreflight(strucdata, selEnt) {
	
	//INCOMING DATA WILL BE A SINGLE SHOT ITEM FROM STRUCTURE
	return new Promise(function (resolve, reject) {
		
		let session = makeNewSession();
		
		session.query('select id, name, type.name from TypedContext where id is "' + selEnt + '"')
		.then(function (entityresponse) {
			
			console.log(entityresponse);
			
			entity_data = entityresponse.data[0];
			enttype = entity_data.__entity_type__;
			entname = entity_data.name;
			
			if (enttype === 'Production') {
				
				session.query('select id, name from Shot where name is ' + strucdata.shotname +' and parent_id is "' + selEnt + '"')
				.then(function (shotresponse) {
					
					//SHOT NOT FOUND.  CREATE ONE.
					if (shotresponse.data.length === 0 ) {
						
						// CREATE NEW SHOT
						const newShot = session.create('Shot', {
							name: strucdata.shotname,
							parent_id: selEnt,
							project_id: PRJ_ID,
						}).then(function (newshotresponse) {
							
							console.log(newshotresponse)
							resolve(newshotresponse.data);
							
						});                        
						
					} else {
						console.log(shotresponse);
						resolve(shotresponse.data[0])
					}
					
				})
				.catch(error => {
					console.log(error);
					reject(false);
				});
				
			}
			
			
		})
		.catch(error => {
			console.log(error);
			reject(false);
		});
		
		
	})
}

function checkCreateFolder(foldername, parentid, prjid) {
	
	return new Promise(function (resolve, reject) {
		
		session.query('select id, name from Folder where name is ' + foldername + ' and parent_id is "' + parentid + '"')
		.then(function (folderresponse) {
			
			//IF FOLDER DOESNT EXIST THEN CREATE AND RETURN
			if (folderresponse.data.length === 0 ) {
				
				// CREATE NEW FOLDER
				const newShot = session.create('Folder', {
					name: foldername,
					parent_id: parentid,
					project_id: prjid,
				}).then(function (newfolderres) {
					
					console.log(newfolderres)
					
					let folderdata = newfolderres.data;
					
					resolve(folderdata.id)
					
				})
			} else {
				
				let folderdata = folderresponse.data[0];
				resolve(folderdata.id)
			}
			
		}).catch((errFold) => {
			console.log(errFold);
			reject(false)
		});
		
	})
	
	
}

function checkCreateTeamsMultiObj(objname, objtype, parentid, prjid) {
	
	return new Promise(function (resolve, reject) {
		
		session.query('select id, name from ' + objtype + ' where name is "' + objname +'" and parent_id is "' + parentid + '"')
		.then(function (multires) {
			
			//IF FOLDER DOESNT EXIST THEN CREATE AND RETURN
			if (multires.data.length === 0 ) {
				
				//CREATE NEW MULTICOMP OR TEAMS OBJ
				const newShot = session.create(`${objtype}`, {
					name: objname,
					parent_id: parentid,
					project_id: prjid,
				}).then(function(newmultires) {
					
					console.log(newmultires);
					let newmultiobj = newmultires.data;
					
					resolve(newmultiobj.id)
					
				})
			} else {
				
				let multiobj = multires.data[0];
				resolve(multiobj.id)
			}
			
		}).catch((errMulti) => {
			console.log(errMulti);
			reject(false)
		});
		
	})
	
	
}

function checkCreateTaskObj(taskname, tasktype, parentid, prjid) {
	
	return new Promise(function (resolve, reject) {
		
		
		session.query('select id, name from Task where name is "' + taskname + '" and type.name is "' + tasktype + '" and parent_id is "' + parentid + '"')
		.then(function (taskresponse) {
			
			console.log(taskresponse);
			
			if (taskresponse.data.length === 0 ) {
				
				//QUERY TASK TYPE ID
				getTaskTypeId(tasktype)
				.then(function(typeres) {
					
					if (typeres != false) {
						
						//CREATE NEW TASK
						const newTask = session.create('Task', {
							name: taskname,
							parent_id: parentid,
							project_id: prjid,
							type_id: typeres
						}).then(function (taskres) {
							
							console.log(taskres);
							
							let newtaskobj = taskres.data;
							let newtaskid = newtaskobj.id;
							
							if (newtaskid) {
								resolve(newtaskid);
							} else {
								reject(false)
							}
							
						})
					} else {
						reject(false)
					}
				})
				
				
			} else {
				
				let thetask = taskresponse.data[0];
				resolve(thetask.id);
			}
			
		})
	})
	
}

function getTaskTypeId(tasktype) {
	console.log('Selected task type is: ', tasktype)
	return new Promise(function (resolve, reject) {
		const q = 'select id, name, type, type_id from Task where type.name is "' + tasktype + '" limit 1';
		
		session.query(q).then(({ data }) => {
			console.log(data);
			const t = data[0];
			if (!t) {
				console.warn('No Task Type found named:', tasktype);
				reject(false);
			}
			console.log('Task Type ID:', t.type_id);
			resolve(t.type_id)
		});
	})
	
}

function parentPreflight(row, subdetail, shotinfo) {
	
	return new Promise(function (resolve, reject) {
		console.log('Special Data: ', window.specials_data);
		console.log('Detail Data: ', subdetail);
		console.log('Shot Info Data: ', shotinfo);
		
		let currshotid = shotinfo;
		
		//PARSE INFO INTO VARS
		let foldername = subdetail.folder;
		let parenttype = subdetail.parenttype;
		let tasktype = subdetail.tasktype;
		
		//THESE TWO VARS MAY CONTAIN TOKENS
		let parentname = replaceTokens(subdetail.parentname, buildVarsFromUI(row));
		let taskname = replaceTokens(subdetail.taskname, buildVarsFromUI(row));
		
		console.log(foldername);
		console.log(parenttype);
		console.log(tasktype);
		console.log(parentname);
		console.log(taskname);
		
		//CHECKING IF FOLDER EXISTS
		checkCreateFolder(foldername, currshotid, PRJ_ID)
		.then(function(thefolder) {
			
			if (thefolder != false) {
				
				//CHECK AND CREATE MULTI OR TEAMS OBJ IF PARENT TYPE NOT FOLDER
				if (parenttype != 'Folder') {
					
					checkCreateTeamsMultiObj(parentname, parenttype, thefolder, PRJ_ID)
					.then(function(themultiobj) {
						
						console.log(themultiobj)
						
						if (themultiobj != false) {
							
							checkCreateTaskObj(taskname, tasktype, themultiobj, PRJ_ID)
							.then(function(thetask) {
								console.log(thetask);
								return resolve(thetask)
							})
						}
						
					})
				} else {
					
					// CREATE TASK INSIDE FOLDER BC PARENT IS FOLDER
					checkCreateTaskObj(taskname, tasktype, thefolder, PRJ_ID)
					.then(function(thetask) {
						console.log(thetask);
						return resolve(thetask)
					})
				}
			} else {
				return reject(false)
			}
			
		})
	})
	
	
}


async function masterMatchMakerSequence(strucdata, specdata, prjid) {
	const rowcollector = document.getElementById('rowcollection');
	if (!rowcollector) throw new Error('#rowcollection not found');
	if (rowcollector.childElementCount === 0) throw new Error('No rows to process');
	
	const datares = await dataPreflight(strucdata, specdata, prjid);
	console.log('preflight:', datares);
	
	const rowProcess = await processRowItems(rowcollector, strucdata);
	console.log('rowProcess:', rowProcess);
	
	return rowProcess; // <-- important
}


// tiny helpers
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function waitForOverlayOff(row, timeout = 6000) {
	if (!row) return;
	const ov = row.shadowRoot?.getElementById?.('riveOverlay');
	if (!ov) return;
	
	if (!ov.classList?.contains('is-on')) return; // already off
	
	// wait via MutationObserver or timeout fallback
	return new Promise(resolve => {
		let done = false;
		const finish = () => { if (!done) { done = true; mo?.disconnect(); resolve(); } };
		
		const mo = new MutationObserver(() => {
			if (!ov.classList.contains('is-on')) finish();
		});
		mo.observe(ov, { attributes: true, attributeFilter: ['class'] });
		
		setTimeout(finish, timeout);
	});
}

async function processRowItems(rowcollector, strucdata) {
	const itemsres = await fieldsPreflight(rowcollector);
	if (Array.isArray(itemsres) && itemsres.length > 0) return itemsres;
	
	document.addEventListener('riveevent', (e) => {
		const { name, data, row } = e.detail;
		console.log('[riveevent]', name, data, row);
	});
	
	const results = [];
	const rows = rowcollector.querySelectorAll('matchup-row');
	await customElements.whenDefined('matchup-row');
	
	let prevRow = null;
	for (const currrow of rows) {
		try {
			if (typeof currrow.riveStart !== 'function') {
				console.warn('Skipping non-upgraded row:', currrow);
				continue;
			}
			
			// ── throttle & sequencing ──────────────────────────────────────
			// 1) ensure previous row's overlay is off (animation finished)
			await waitForOverlayOff(prevRow);
			// 2) plus an extra 2s pause before starting the next row
			await sleep(2000);
			
			// Now we can center the next row and start its rive
			scrollChildIntoCenter(rowcollector, currrow);
			currrow.riveStart();              // shows overlay + triggers loader
			currrow.riveFire('start_loader'); // safe even if queued internally
			console.log('riveStart for row:', currrow.id || '(no id)');
			
			// ── your existing per-row work ────────────────────────────────
			const rowres = await rowPreflight(currrow);
			if (rowres !== false) {
				const procres = await processShotItems(currrow, strucdata, SELECTED_ENTITY);
				results.push(procres);
				
				currrow.riveSetBool?.('isSuccessful', true);
				await setDetailsTxtRuntime(currrow, true);
				currrow.riveStop?.();
				// if your SM auto-hides the overlay, great; if not, you can call:
				// currrow.riveClose?.();
			}
		} catch (errRow) {
			console.log('row error:', errRow);
			currrow.riveSetNumber?.('EndHeroFail', await randomItem([0,1,2]));
			currrow.riveSetBool?.('isSuccessful', false);
			await setDetailsTxtRuntime(currrow, false);
			currrow.riveFire?.('stop_loader');
			// optionally: currrow.riveClose?.();
		}
		
		prevRow = currrow; // so the next loop waits for this one to finish
	}
	
	return results;
}



async function processShotItems(row, strucdata, selEnt) {
	const out = [];
	for (const currshot of strucdata || []) {
		try {
			const shotres = await shotPreflight(currshot, selEnt);   // {id,name,...}
			console.log('shotres:', shotres);
			
			const detaildata = currshot.details || [];
			const parentResults = await processParentItems(row, detaildata, shotres.id, selEnt);
			
			out.push({ shot: shotres, parents: parentResults });     // keep what you need
		} catch (errShot) {
			console.log(errShot);
			out.push({ shot: false, parents: [] });
		}
	}
	return out;                           // <<— IMPORTANT: return something
}

async function processParentItems(row, detaildata, currshot, selEnt) {
	const out = [];
	for (const currparent of detaildata || []) {
		try {
			const parentres = await parentPreflight(row, currparent, currshot);
			console.log('parentres:', parentres);
			out.push(parentres);
		} catch (errParent) {
			console.log(errParent);
			out.push(false);                 // or skip push if you prefer
		}
	}
	return out;                          // <<— IMPORTANT: return something
}

async function randomLooperPhrase(row, txtRun) {
	
	const phraseArr = [
		"Swiping Right...",
		"Sharpening Rizz...",
		"Sliding into DMs...",
		"Padding Profile...",
		"Honing Stats...",
		"Checking chemistry...",
		"Passing Vibe Checks...",
		"Meeting For Coffee...",
		"Checking Horoscope...",
		"Evaluating Compatibility",
		"Making a move..."
	]
	
	let nextPhrase = await randomItem(phraseArr);
	
	row.riveSetText(txtRun, nextPhrase);
	
}

async function setDetailsTxtRuntime(row, hasSuccess) {
	
	let awayCode = row.awayTricode;
	let homeCode = row.homeTricode;
	let txtDetail = '';
	if (hasSuccess == true) {
		txtDetail = awayCode + " vs " + homeCode + " was created successfully!"
	} else {
		txtDetail = "Devastation! " + awayCode + " vs " + homeCode + " creation failed."
	}
	
	row.riveSetText('ResultDetailsTxt', txtDetail);
	return
	
}



// Random INDEX (or -1 if empty / not an array)
async function randomIndex(arr) {
	return Array.isArray(arr) && arr.length ? Math.floor(Math.random() * arr.length) : -1;
}

// Random VALUE (or undefined if empty / not an array)
async function randomItem(arr) {
	const i = randomIndex(arr);
	return i === -1 ? undefined : arr[i];
}



function preflightChecks() {
	//DEFOCUS BG ELEMENTS
	blurBGElements();
	
	// //INIT RIVE ANIM
	triggerRiveStart();
	
	// INTERFACE ERROR CHECKING
	checkToggles().then(function (tglresult) {
		
		if (tglresult !== true) {
			throw new Error(tglresult);
		}
		
		checkShotStructure().then(function (structresult) {
			if (structresult !== true) {
				throw new Error(structresult);
			}
			
			console.log("ERROR CHECKS PASSED.  MOVING ON...")
			createShotAndTasks();
			
		})
		.catch(error => {
			console.log(error);
			triggerFailure(error);
		});
		
	})
	.catch(error => {
		console.log(error);
		triggerFailure(error);
	});
}

function createShotAndTasks() {
	
	var rejections = [];
	
	//COMP AND 3D TASK LISTS
	var cmpTaskList = [];
	var thrDTaskList = [];
	
	//3D TASK TYPES
	var mayaType = "c53970b0-ecbe-433d-a307-b8477d7e7c5a";
	var c4dType = "e543387d-6f3f-4184-8da3-34225139c643";
	var maxType = "ced440d9-9851-4165-ac40-fe0a4aa290b8";
	var cmpType = "44dd23b6-4164-11df-9218-0019bb4983d8";
	var templateType = "e88adbd1-851f-415f-bc63-214d22bfc3b9";
	
	//ASSIGNING TASK TYPE BASED ON SELECTION
	var c4dtasktypeselect = document.getElementById("c4dicon");
	var mayatasktypeselect = document.getElementById("mayaicon");
	var the3dtasktype;
	if (c4dtasktypeselect.classList.contains("rowiconon")) {
		the3dtasktype = c4dType;
	} else {
		the3dtasktype = mayaType;
	}
	
	
	//CREDENTIALS AND SESSION
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
	var isMultiObj = false;
	var hasShotNumbering = false;
	
	//SHOT NAME FROM UI
	var shotNameField = document.getElementById("searchbar");
	var currShotName = shotNameField.value;
	
	//TEAMS OBJ NAME FROM UI
	var multiteamsdd = $('#multiteamsselect').find(":selected").text();
	var teamsObjField = document.getElementById("standalonefield");
	var teamsObjName = teamsObjField.value;
	
	//COMP AND 3D TASK TOGGLES
	var cmptggle = document.getElementById("compswitch");
	var threedtggle = document.getElementById("threedswitch");
	var stndtggle = document.getElementById("standaloneswitch");
	
	var compTbl = document.getElementById("comptablebody");
	var thrdTbl = document.getElementById("threedtablebody");
	
	var theshots = document.getElementById("threedshots");
	var shotchildren = [];
	
	if (cmptggle.classList.contains("toggle-on")) {
		
		console.log("THE COMP TOGGLE IS ON!")
		
		isCompElement = true;
		
		for (var i = 0; i < compTbl.rows.length; i++) {
			var currrow = compTbl.rows[i];
			var rowinpt = currrow.children[0].children[0].value;
			cmpTaskList.push(rowinpt)
		}
		
		console.log(cmpTaskList)
	}
	
	if (threedtggle.classList.contains("toggle-on")) {
		console.log("THE 3D TOGGLE IS ON!")
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
	
	
	if (multiteamsdd === "Teams") {
		isTeamsObj = true;
	} else if (multiteamsdd === "Multicomp") {
		isMultiObj = true;
	}
	
	// if (stndtggle.classList.contains("toggle-on")) {
	//     isTeamsObj = true;
	// }
	
	
	
	if (isTeamsObj == true) {
		if (teamsObjName.length == 0) {
			
			rejections.push("MISSING STANDALONE NAME");
			
			if (rejections.length != 0) {
				var therejects = rejections.join(" and ");
				var errtxt = "Errors: " + therejects.toUpperCase();
				adjustTxtRuntimes("RunError", errtxt);
				adjustTxtRuntimes("RunSuccess", "Input Needed");
			}
			
			setTimeout(function() {
				fireAnim("stopAnim");
				fireAnim("sendErr");
			}, 500);
			
			return
		}
	}
	
	if (isMultiObj == true) {
		
		if (teamsObjName.length == 0) {
			
			rejections.push("MISSING STANDALONE NAME");
			
			if (rejections.length != 0) {
				var therejects = rejections.join(" and ");
				var errtxt = "Errors: " + therejects.toUpperCase();
				adjustTxtRuntimes("RunError", errtxt);
				adjustTxtRuntimes("RunSuccess", "Input Needed");
			}
			
			setTimeout(function() {
				fireAnim("stopAnim");
				fireAnim("sendErr");
			}, 500);
			
			return
		}
	}
	
	//GETTING BASE ENTITY
	var baseentity = ftrackWidget.getEntity();
	var entity = SESSION_ENTITY;
	console.log(entity);
	
	
	
	//ESTABLISHING VARS FOR CREATED ENTITIES
	var theShotEnt;
	var theCompFoldEnt;
	var the3DFoldEnt;
	var thecmpTeamsObjEnt;
	var thecmpMulticompObjEnt;
	var the3DTeamsObjEnt;
	var the3DMulticompObjEnt;
	
	//PROMISE CHAIN FUNCTIONS
	function shotItemPromise() {
		
		return new Promise(function(resolve,reject) {
			
			createShot(entity, theprjid, currShotName)
			.then(resShotEnt => {
				
				console.log(resShotEnt);
				
				if (resShotEnt.data != undefined) {
					theShotEnt = resShotEnt.data;
				} else {
					theShotEnt = resShotEnt;
				}
				
				console.log(theShotEnt);
				resolve(theShotEnt)
				
				
			}).catch((err) => {
				console.log(err);
				rejections.push[err];
				reject(err);
			});
			
		})
	}
	
	function compFoldPromise() {
		
		return new Promise(function(resolve,reject) {
			
			if (isCompElement == true) {
				createCmpFold(theShotEnt, theprjid, "02_cmp")
				.then(resCmpFoldEnt => {
					
					console.log(resCmpFoldEnt);
					if (resCmpFoldEnt.data != undefined) {
						theCompFoldEnt = resCmpFoldEnt.data;
					} else {
						theCompFoldEnt = resCmpFoldEnt;
					}
					
					console.log(theCompFoldEnt)
					resolve(theCompFoldEnt)
					
					
					
				}).catch((err) => {
					console.log(err);
					rejections.push[err];
					reject(err);
				});
				
			} else {
				resolve("None");
			}
		});
	}
	
	function threedFoldPromise() {
		
		return new Promise(function(resolve,reject) {
			
			if (is3DElement == true) {
				create3DFold(theShotEnt, theprjid, "00_3D")
				.then(resthrDFoldEnt => {
					
					console.log(resthrDFoldEnt);
					
					if (resthrDFoldEnt.data != undefined) {
						the3DFoldEnt = resthrDFoldEnt.data;
					} else {
						the3DFoldEnt = resthrDFoldEnt;
					}
					
					console.log(the3DFoldEnt);
					resolve(the3DFoldEnt);
					
				}).catch((err) => {
					console.log(err);
					rejections.push[err];
					reject(err);
				});
			} else {
				resolve("None");
			}
			
			
		});
	}
	
	function cmpTeamsObjPromise(compElemsActive) {
		
		return new Promise(function(resolve,reject) {
			
			if (compElemsActive != "None") {
				
				//CHECKING IF TEAMS OBJ IS CHECKED
				if (isTeamsObj == true) {
					createTeamObj(theCompFoldEnt, theprjid, teamsObjName)
					.then(resteamObjEnt => {
						
						if (resteamObjEnt == ERROR_MULTIPLE_TMS_OBJ) {
							throw new Error(ERROR_MULTIPLE_TMS_OBJ);
						} else {
							
							console.log(resteamObjEnt);
							if (resteamObjEnt.data != undefined) {
								thecmpTeamsObjEnt = resteamObjEnt.data;
							} else {
								thecmpTeamsObjEnt = resteamObjEnt;
							}
							console.log(thecmpTeamsObjEnt);
							
							var tmname = thecmpTeamsObjEnt.name;
							var tmid = thecmpTeamsObjEnt.id;
							
							
							var thmbNameJoin = tmname.toUpperCase() + "_THUMBNAIL";
							
							session.query('select thumbnail_id from TypedContext where parent_id is "' + thumbResFold + '" and name is "' + thmbNameJoin + '"')
							.then(function(data) {
								console.log(data)
								
								
								
								var tskThumbId = data?.data?.[0]?.thumbnail_id;
								
								if (tskThumbId !== undefined && tskThumbId !== null && tskThumbId !== 'undefined') {
									session.update("Teams", [tmid], {
										thumbnail_id: tskThumbId,
									})
									.then(() => {
										resolve(thecmpTeamsObjEnt);
									})
								} else {
									resolve(thecmpTeamsObjEnt);
								}
								
							})
							
							
						}
						
						
						
						
					}).catch((err) => {
						
						if (err == ERROR_MULTIPLE_TMS_OBJ) {
							reject(ERROR_MULTIPLE_TMS_OBJ);
						} else {
							console.log(err);
							rejections.push[err];
							reject(err);
						}
						
					});
					
				} else {
					
					resolve(theCompFoldEnt);
					
				}
			} else {
				resolve("None");
			}
			
			
		});
		
	}
	
	function cmpMulticompObjPromise(compElemsActive) {
		
		return new Promise(function(resolve,reject) {
			
			if (compElemsActive != "None") {
				
				//CHECKING IF TEAMS OBJ IS CHECKED
				if (isMultiObj == true) {
					createMulticompObj(theCompFoldEnt, theprjid, teamsObjName)
					.then(resMultiObjEnt => {
						
						if (resMultiObjEnt == ERROR_MULTIPLE_TMS_OBJ) {
							throw new Error(ERROR_MULTIPLE_TMS_OBJ);
						} else {
							
							console.log(resMultiObjEnt);
							if (resMultiObjEnt.data != undefined) {
								thecmpMulticompObjEnt = resMultiObjEnt.data;
							} else {
								thecmpMulticompObjEnt = resMultiObjEnt;
							}
							
							console.log(thecmpMulticompObjEnt);
							var multicmpname = thecmpMulticompObjEnt.name;
							var multicmpid = thecmpMulticompObjEnt.id;
							
							
							var thmbNameJoin = multicmpname.toUpperCase() + "_THUMBNAIL";
							
							session.query('select thumbnail_id from TypedContext where parent_id is "' + thumbResFold + '" and name is "' + thmbNameJoin + '"')
							.then(function(data) {
								console.log(data)
								
								
								var tskThumbId = data?.data?.[0]?.thumbnail_id;
								
								if (tskThumbId !== undefined && tskThumbId !== null && tskThumbId !== 'undefined') {
									
									session.update("Multicomp", [multicmpid], {
										thumbnail_id: tskThumbId,
									})
									.then(() => {
										resolve(thecmpMulticompObjEnt);
									})
								} else {
									resolve(thecmpMulticompObjEnt);
								}
								
							})
							
						}
						
						
						
						
					}).catch((err) => {
						
						if (err == ERROR_MULTIPLE_MULTICOMP_OBJ) {
							reject(ERROR_MULTIPLE_MULTICOMP_OBJ);
						} else {
							console.log(err);
							rejections.push[err];
							reject(err);
						}
						
					});
					
				} else {
					
					resolve(theCompFoldEnt);
					
				}
			} else {
				resolve("None");
			}
			
			
		});
		
	}
	
	function thrdTeamsObjPromise(thrdElemsActive) {
		
		return new Promise(function(resolve,reject) {
			
			if (thrdElemsActive != "None") {
				//CHECKING IF TEAMS OBJ IS CHECKED
				if (isTeamsObj == true) {
					createTeamObj(the3DFoldEnt, theprjid, teamsObjName)
					.then(resteamObjEnt => {
						
						console.log(resteamObjEnt);
						if (resteamObjEnt.data != undefined) {
							the3DTeamsObjEnt = resteamObjEnt.data;
						} else {
							the3DTeamsObjEnt = resteamObjEnt;
						}
						console.log(the3DTeamsObjEnt);
						resolve(the3DTeamsObjEnt);
						
					}).catch((err) => {
						console.log(err);
						reject(err);
						rejections.push[err];
						
					});
					
				} else {
					
					resolve(the3DFoldEnt);
					
				}
			} else {
				resolve("None");
			}
			
			
		});
		
	}
	
	function thrdMulticompObjPromise(thrdElemsActive) {
		
		return new Promise(function(resolve,reject) {
			
			if (thrdElemsActive != "None") {
				//CHECKING IF TEAMS OBJ IS CHECKED
				if (isMultiObj == true) {
					createMulticompObj(the3DFoldEnt, theprjid, teamsObjName)
					.then(resMulticompObjEnt => {
						
						console.log(resMulticompObjEnt);
						if (resMulticompObjEnt.data != undefined) {
							the3DMulticompObjEnt = resMulticompObjEnt.data;
						} else {
							the3DMulticompObjEnt = resMulticompObjEnt;
						}
						console.log(the3DMulticompObjEnt);
						resolve(the3DMulticompObjEnt);
						
					}).catch((err) => {
						console.log(err);
						reject(err);
						rejections.push[err];
						
					});
					
				} else {
					
					resolve(the3DFoldEnt);
					
				}
			} else {
				resolve("None");
			}
			
			
		});
		
	}
	
	
	//GET AND DO EVERYTHING
	shotItemPromise().then(function(res) {
		
		console.log(res);
		return Promise.all([compFoldPromise(), threedFoldPromise()])
		
	}).then(function(response) {
		
		
		console.log(response);
		return Promise.all([cmpTeamsObjPromise(response[0]), cmpMulticompObjPromise(response[0]), thrdTeamsObjPromise(response[1]), thrdMulticompObjPromise(response[1])])
		
		
		
	}).then(function(result) {
		
		console.log(result);
		console.log(cmpTaskList);
		var cmpUseItem;
		var threedUseItem;
		
		if (isTeamsObj == true) {
			cmpUseItem = result[0];
			threedUseItem = result[2];
		} else if (isMultiObj == true) {
			cmpUseItem = result[1];
			threedUseItem = result[3];
		} else {
			cmpUseItem = result[0];
			threedUseItem = result[2];
		}
		
		
		// return Promise.all([processCompTasks(cmpTaskList, result[0], theprjid, cmpType),processCompTasks(["TEMPLATE"], result[0], theprjid, templateType), process3DTasks(thrDTaskList, result[2], theprjid, the3dtasktype), process3DTasks(["TEMPLATE"], result[2], theprjid, templateType)])
		// return Promise.all([processCompTasks(cmpTaskList, cmpUseItem, theprjid, cmpType), processCompTasks(["TEMPLATE"], cmpUseItem, theprjid, templateType), process3DTasks(thrDTaskList, threedUseItem, theprjid, the3dtasktype) ,process3DTasks(["TEMPLATE"], threedUseItem, theprjid, templateType)])
		return Promise.all([processCompTasks(cmpTaskList, cmpUseItem, theprjid, cmpType), process3DTasks(thrDTaskList, threedUseItem, theprjid, the3dtasktype)])
		
		
	}).then(function(resp) {
		
		console.log("PROCESSED ALL ENTRIES")
		
		if (rejections.length != 0) {
			var therejects = rejections.join(" and ");
			var errtxt = "Run errors: " + therejects.toUpperCase();
			adjustTxtRuntimes("RunError", errtxt);
			adjustTxtRuntimes("RunSuccess", "Shots finished with errors");
		}
		
		if (rejections.length > 0) {
			setTimeout(function() {
				fireAnim("stopAnim");
				fireAnim("sendErr");
				
			}, 500);
		} else {
			setTimeout(function() {
				fireAnim("stopAnim");
			}, 500);
		}
		
		
		
		
	})
	.catch(error => {
		// Handle errors
		console.error(error);
		if (error == "MULTIPLE") {
			//TRIGGERING ERROR FOR MULTIPLE TEAMS ITEMS
			adjustTxtRuntimes("RunError", "A Teams Object already exists.");
			adjustTxtRuntimes("RunSuccess", "Error: Multiple Teams Objects");
			
			setTimeout(() => {
				fireAnim("stopAnim");
				fireAnim("sendErr");
				
			},1000);
		}
	});
	
}

// CREATE NEW SHOT
function createShot(entity, prjid, shotName) {
	
	return new Promise(function (resolve, reject) {
		console.log(entity)
		session.query('select id, name from Shot where name is ' + shotName +' and parent_id is "' + entity.id + '"')
		.then(function (response) {
			
			return new Promise(function (resp, rej) {
				
				if (response.data.length > 0) {
					
					console.log('SHOT ALREADY EXISTS. PUSHING SHOT NAME TO LIST...');
					
					entityCheckObj[0].shot_id = response.data[0].id;
					entityCheckObj[0].shot_name = response.data[0].name;
					
					resp(response.data[0]);                    
					
				} else {
					rej("None")
				}
			}).then(function (ret) {
				
				if (ret !== "None") {
					
					resolve(ret);
					
				} else {
					
					// Fetch the entity (project, shot, or folder) you want to add the folder to
					session.query('select id, name from TypedContext where id is "' + entity.id + '"')
					.then(function (entityResponse) {
						
						if (entityResponse.data.length === 0) {
							console.error('ENTITY NOT FOUND.');
							reject('ENTITY NOT FOUND.');
						}
						
						const entity = entityResponse.data[0];
						
						// CREATE NEW SHOT
						const newShot = session.create('Shot', {
							name: shotName,
							parent_id: entity.id,
							project_id: prjid,
						}).then(function (res) {
							
							console.log(res)
							resolve(res);
							
						});
						
					})
					.catch(function (error) {
						console.error('ERROR FETCHING ENTITY:', error);
						reject('ERROR FETCHING ENTITY:', error);
					});
				}
			})
			.catch( () => {
				// Fetch the entity (project, shot, or folder) you want to add the folder to
				session.query('select id, name from TypedContext where id is "' + entity.id + '"')
				.then(function (entityResponse) {
					
					if (entityResponse.data.length === 0) {
						console.error('ENTITY NOT FOUND.');
						reject('ENTITY NOT FOUND.');
					}
					
					const entity = entityResponse.data[0];
					
					// CREATE NEW SHOT
					const newShot = session.create('Shot', {
						name: shotName,
						parent_id: entity.id,
						project_id: prjid,
					}).then(function (res) {
						
						console.log(res)
						resolve(res);
						
					});
					
				})
				.catch(function (error) {
					console.error('ERROR FETCHING ENTITY:', error);
					reject('ERROR FETCHING ENTITY:', error);
				});
			});
			
			
		})
		.catch(function (error) {
			console.error('ERROR QUERYING SHOT:', error);
			reject('ERROR QUERYING SHOT:', error);
		});
		
	});
	
	
	
}

// CREATE NEW COMP FOLDER
function createCmpFold(shotEntId, prjid, foldName) {
	
	return new Promise(function (resolve, reject) {
		
		session.query('select id, name from Folder where name is ' + foldName +' and parent_id is "' + shotEntId.id + '"')
		.then(function (response) {
			
			return new Promise(function (resp, rej) {
				if (response.data.length > 0) {
					
					console.log('FOLDER ALREADY EXISTS.');
					console.log(response);
					entityCheckObj[0].compfolder_id = response.data[0].id;
					entityCheckObj[0].compfolder_name = foldName;
					resp(response.data[0])
				} else {
					rej("None")
				}
			}).then(function (ret) {
				
				if (ret !== "None") {
					
					resolve(ret)
					
				} else {
					
					console.log(shotEntId)
					// FETCH PARENT ENTITY
					session.query('select id, name from TypedContext where id is "' + shotEntId.id + '"')
					.then(function (entityResponse) {
						
						if (entityResponse.length === 0) {
							console.error('ENTITY NOT FOUND.');
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
						console.error('ERROR FETCHING ENTITY:', error);
						reject('Error fetching entity:', error);
					});
				}
				
			})
			.catch(() => {
				console.log(shotEntId)
				// FETCH PARENT ENTITY
				session.query('select id, name from TypedContext where id is "' + shotEntId.id + '"')
				.then(function (entityResponse) {
					
					if (entityResponse.length === 0) {
						console.error('ENTITY NOT FOUND.');
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
					console.error('ERROR FETCHING ENTITY:', error);
					reject('Error fetching entity:', error);
				});
			});
			
		})
		.catch(function (error) {
			console.error('ERROR QUERYING FOLDER:', error);
			reject('Error querying folder:', error);
		});
		
	});
	
	
	
}

// CREATE NEW 3D FOLDER
function create3DFold(shotEntId, prjid, foldName) {
	
	return new Promise(function (resolve, reject) {
		
		session.query('select id, name from Folder where name is ' + foldName +' and parent_id is "' + shotEntId.id + '"')
		.then(function (response) {
			
			return new Promise(function (resp, rej) {
				
				if (response.data.length > 0) {
					
					console.log('Folder already exists.');
					console.log(response);
					entityCheckObj[0].threedfolder_id = response.data[0].id;
					entityCheckObj[0].threedfolder_name = foldName;
					resp(response.data[0]);
					
				} else {
					
					rej("None");
					
				}
				
			}).then(function (ret) {
				
				if (ret !== "None") {
					
					resolve(ret)
					
				} else {
					
					// FETCH PARENT ENTITY
					session.query('select id, name from TypedContext where id is "' + shotEntId.id + '"')
					.then(function (entityResponse) {
						
						if (entityResponse.length === 0) {
							console.error('ENTITY NOT FOUND.');
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
						console.error('ERROR FETCHING ENTITY:', error);
						reject('Error fetching entity:', error);
					});
					
				}
				
			})
			.catch(() => {
				// FETCH PARENT ENTITY
				session.query('select id, name from TypedContext where id is "' + shotEntId.id + '"')
				.then(function (entityResponse) {
					
					if (entityResponse.length === 0) {
						console.error('ENTITY NOT FOUND.');
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
					console.error('ERROR FETCHING ENTITY:', error);
					reject('Error fetching entity:', error);
				});
			});
			
			
			
			
		})
		.catch(function (error) {
			console.error('ERROR QUERYING FOLDER:', error);
			reject('Error querying folder:', error);
		});
		
	});
	
	
	
}

// CREATE NEW TEAMS OBJ
function createTeamObj(foldEntId, prjid, teamsName) {
	
	return new Promise(function (resolve, reject) {
		console.log(foldEntId)
		session.query('select id, name from Teams where parent_id is "' + foldEntId.id + '"')
		.then(function (response) {
			
			return new Promise(function (resp, rej) {
				
				if (response.data.length > 0) {
					
					var theObj;
					console.log(response.data);
					for (var t=0; t <= response.data.length; t++) {
						
						if (response.data[t].name == teamsName) {
							theObj = response.data[t];
							break;
						}
					}
					
					if (foldEntId.name == "02_cmp") {
						entityCheckObj[0].teamsobjectcmp_id = response.data[0].id;
						entityCheckObj[0].teamsobjectcmp_name = response.data[0].name;
					} else {
						entityCheckObj[0].teamsobjectthrd_id = response.data[0].id;
						entityCheckObj[0].teamsobjectthrd_name = response.data[0].name;
					}
					
					console.log(theObj);
					resp(theObj);
					
					
				} else {
					rej("None")
				}
			}).then(function (ret) {
				
				if (ret == ERROR_MULTIPLE_TMS_OBJ){
					throw new Error(ERROR_MULTIPLE_TMS_OBJ);
				}
				
				if (ret !== "None") {
					
					resolve(ret);
					
				} else {
					
					
					// FETCH PARENT ENTITY
					session.query('select id, name from TypedContext where id is "' + foldEntId.id + '"')
					.then(function (entityResponse) {
						
						if (entityResponse.data.length === 0) {
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
						console.error('ERROR FETCHING ENTITY:', error);
						reject('Error fetching entity:', error);
					});
				}
				
			})
			.catch(function (args) {
				
				if (args == ERROR_MULTIPLE_TMS_OBJ){
					
					console.error(ERROR_MULTIPLE_TMS_OBJ);
					reject(ERROR_MULTIPLE_TMS_OBJ);
					
					
				} else {
					
					// FETCH PARENT ENTITY
					session.query('select id, name from TypedContext where id is "' + foldEntId.id + '"')
					.then(function (entityResponse) {
						
						if (entityResponse.data.length === 0) {
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
						console.error('ERROR FETCHING ENTITY:', error);
						reject('Error fetching entity:', error);
					});
					
				}
				
				
			});
			
			
		})
		.catch(function (error) {
			
			console.error(error);
			reject(error);
			
			
		});
		
	});
	
	
	
}

// CREATE NEW MULTICOMP OBJ
function createMulticompObj(foldEntId, prjid, teamsName) {
	
	return new Promise(function (resolve, reject) {
		console.log(foldEntId)
		session.query('select id, name from Multicomp where parent_id is "' + foldEntId.id + '"')
		.then(function (response) {
			
			return new Promise(function (resp, rej) {
				
				if (response.data.length > 0) {
					
					var theObj;
					console.log(response.data);
					for (var t=0; t <= response.data.length; t++) {
						
						if (response.data[t].name == teamsName) {
							theObj = response.data[t];
							break;
						}
					}
					
					if (foldEntId.name == "02_cmp") {
						entityCheckObj[0].multicompobjectcmp_id = response.data[0].id;
						entityCheckObj[0].multicompobjectcmp_name = response.data[0].name;
					} else {
						entityCheckObj[0].multicompobjectthrd_id = response.data[0].id;
						entityCheckObj[0].multicompobjectthrd_name = response.data[0].name;
					}
					
					console.log(theObj);
					resp(theObj);
					
					
				} else {
					rej("None")
				}
			}).then(function (ret) {
				
				console.log(ret);
				if (ret == ERROR_MULTIPLE_MULTICOMP_OBJ){
					throw new Error(ERROR_MULTIPLE_MULTICOMP_OBJ);
				}
				
				console.log('Checking return.');
				if (ret !== "None") {
					
					resolve(ret);
					
				} else {
					
					
					// FETCH PARENT ENTITY
					session.query('select id, name from TypedContext where id is "' + foldEntId.id + '"')
					.then(function (entityResponse) {
						
						if (entityResponse.data.length === 0) {
							console.error('Entity not found.');
							reject('Entity not found.');
						}
						
						const entity = entityResponse.data[0];
						console.log(entity);
						
						// CREATE NEW MULTICOMP
						const newFold = session.create('Multicomp', {
							name: teamsName,
							parent_id: entity.id,
							project_id: prjid
						}).then(function (res) {
							
							resolve(res);
							
						});
						
						
					})
					.catch(function (error) {
						console.error('ERROR FETCHING ENTITY:', error);
						reject('Error fetching entity:', error);
					});
				}
				
			})
			.catch(function (args) {
				
				if (args == ERROR_MULTIPLE_MULTICOMP_OBJ){
					
					console.error(ERROR_MULTIPLE_MULTICOMP_OBJ);
					reject(ERROR_MULTIPLE_MULTICOMP_OBJ);
					
					
				} else {
					
					// FETCH PARENT ENTITY
					session.query('select id, name from TypedContext where id is "' + foldEntId.id + '"')
					.then(function (entityResponse) {
						
						if (entityResponse.data.length === 0) {
							console.error('Entity not found.');
							reject('Entity not found.');
						}
						
						const entity = entityResponse.data[0];
						
						// CREATE NEW SHOT
						const newFold = session.create('Multicomp', {
							name: teamsName,
							parent_id: entity.id,
							project_id: prjid,
						}).then(function (res) {
							
							resolve(res);
							
						});
						
					})
					.catch(function (error) {
						console.error('ERROR FETCHING ENTITY:', error);
						reject('Error fetching entity:', error);
					});
					
				}
				
				
			});
			
			
		})
		.catch(function (error) {
			
			console.error(error);
			reject(error);
			
			
		});
		
	});
	
	
	
}

// CREATE NEW COMP TASK
function createCompTask(parentEntId, prjid, currTaskName, typeid) {
	
	return new Promise(function (resolve, reject) {
		
		
		session.query('select id, name from Task where name is ' + currTaskName +' and parent_id is "' + parentEntId + '"')
		.then(function (response) {
			console.log(response);
			if (response.data.length > 0) {
				cmpTaskErrs.push(currTaskName);
				reject(ERROR_DUPE_TASK)
			}
			
			
			// FETCH PARENT ENTITY
			session.query('select id, name from TypedContext where id is "' + parentEntId + '"')
			.then(function (entityResponse) {
				console.log(entityResponse)
				if (entityResponse == ERROR_DUPE_TASK){
					console.log(ERROR_DUPE_TASK);
					cmpTaskErrs.push(currTaskName);
					reject(ERROR_DUPE_TASK)
				}
				if (entityResponse.data.length === 0) {
					console.log(ERROR_DUPE_TASK);
					cmpTaskErrs.push(currTaskName);
					reject(ERROR_DUPE_TASK);
				}
				
				
				const entity = entityResponse.data[0];
				
				if (thumbnailwhitelist.includes(currTaskName)) {
					var thmbNameJoin = currTaskName.toUpperCase() + "_THUMBNAIL";
					session.query('select thumbnail_id from TypedContext where parent_id is "' + thumbResFold + '" and name is "' + thmbNameJoin + '"')
					
					.then(function(data) {
						
						if (data == ERROR_DUPE_TASK) {
							reject(ERROR_DUPE_TASK);
						}
						
						console.log(data);
						var tskThumbId = data.data[0].thumbnail_id
						
						
						//CREATE NEW TASK
						const newFold = session.create('Task', {
							name: currTaskName,
							parent_id: entity.id,
							project_id: prjid,
							type_id: typeid,
							thumbnail_id: tskThumbId
						}).then(function (res) {
							
							if (res == ERROR_DUPE_TASK) {
								reject(ERROR_DUPE_TASK);
							}
							
							resolve(res);
							
						})
						.catch(function (error) {
							console.error('Error duplicate task:', error);
							reject(ERROR_DUPE_TASK)
						});
						
					})
					.catch(function (error) {
						console.error('Error duplicate task:', error);
						reject(ERROR_DUPE_TASK)
					});
					
				} else {
					
					// CREATE NEW TASK
					const newFold = session.create('Task', {
						name: currTaskName,
						parent_id: entity.id,
						project_id: prjid,
						type_id: typeid
					})
					.then(function (res) {
						
						if (res == ERROR_DUPE_TASK) {
							reject(ERROR_DUPE_TASK);
						}
						
						resolve(res);
						
					})
					.catch(function (error) {
						console.error('Error duplicate task:', error);
						reject(ERROR_DUPE_TASK)
					});
					
				}
				
			})
			.catch(function (error) {
				console.error('Error duplicate task:', error);
				reject(ERROR_DUPE_TASK)
			});
			
		})
		.catch(function (error) {
			console.error('Error duplicate task:', error);
			reject(ERROR_DUPE_TASK)
		});
		
	});
	
	
	
}

// CREATE NEW 3D TASK
function create3DTask(parentEntId, prjid, currTaskName, typeid) {
	
	return new Promise(function (resolve, reject) {
		
		
		session.query('select id, name from Task where name is ' + currTaskName +' and parent_id is "' + parentEntId + '"')
		.then(function (response) {
			if (response.data.length > 0) {
				taskErrs.push(currTaskName);
				reject(ERROR_DUPE_TASK)
			}
			
			// FETCH PARENT ENTITY
			session.query('select id, name from TypedContext where id is "' + parentEntId + '"')
			.then(function (entityResponse) {
				
				if (entityResponse.data.length === 0) {
					taskErrs.push(currTaskName);
					reject(ERROR_DUPE_TASK)
				}
				
				if (entityResponse.data.length === 0) {
					console.log(ERROR_DUPE_TASK);
					cmpTaskErrs.push(currTaskName);
					reject(ERROR_DUPE_TASK);
				}
				
				const entity = entityResponse.data[0];
				
				var shotstxt = document.getElementById("mkshotstxt");
				var adjTaskName;
				
				if (shotstxt.classList.contains("makeshotstxtbright")) {
					adjTaskName = currTaskName.split("_")[0];
				}
				
				if (thumbnailwhitelist.includes(currTaskName) || thumbnailwhitelist.includes(adjTaskName)) {
					
					if (currTaskName.split("_").length > 1) {
						var thmbNameJoin = adjTaskName.toUpperCase() + "_THUMBNAIL";
					} else {
						var thmbNameJoin = currTaskName.toUpperCase() + "_THUMBNAIL";
					}
					
					session.query('select thumbnail_id from TypedContext where parent_id is "' + thumbResFold + '" and name is "' + thmbNameJoin + '"')
					.then(function(data) {
						
						if (data == ERROR_DUPE_TASK) {
							reject(ERROR_DUPE_TASK);
						}
						
						var tskThumbId = data.data[0].thumbnail_id
						
						//CREATE NEW TASK
						const newFold = session.create('Task', {
							name: currTaskName,
							parent_id: entity.id,
							project_id: prjid,
							type_id: typeid,
							thumbnail_id: tskThumbId
						})
						.then(function (res) {
							
							if (res == ERROR_DUPE_TASK) {
								reject(ERROR_DUPE_TASK);
							}
							
							resolve(res);
							
						})
						.catch(function (error) {
							console.error('Error duplicate task:', error);
							reject(ERROR_DUPE_TASK)
						});
						
					})
					.catch(function (error) {
						console.error('Error duplicate task:', error);
						reject(ERROR_DUPE_TASK)
					});
					
				} else {
					
					// CREATE NEW SHOT
					const newFold = session.create('Task', {
						name: currTaskName,
						parent_id: entity.id,
						project_id: prjid,
						type_id: typeid
					})
					.then(function (res) {
						
						if (res == ERROR_DUPE_TASK) {
							reject(ERROR_DUPE_TASK);
						}
						
						resolve(res);
						
					})
					.catch(function (error) {
						console.error('Error duplicate task:', error);
						reject(ERROR_DUPE_TASK)
					});
					
				}
				
				
				
			})
			.catch(function (error) {
				console.error('Error duplicate task:', error);
				reject(ERROR_DUPE_TASK)
			});
			
		})
		.catch(function (error) {
			console.error('Error duplicate task:', error);
			reject(ERROR_DUPE_TASK)
		});
		
	});
	
	
	
}

async function processCompTasks(compArr, entOBJ, projID, tasktype) {
	
	if (compArr.length > 0) {
		
		if (entOBJ != "None") {
			
			for (var x=0; x < compArr.length; x++) {
				
				await createCompTask(entOBJ.id, projID, compArr[x], tasktype)
				.then(taskItemEnt => {
					console.log("Item " + taskItemEnt.data.name + " successfully added.")
				}).catch((errTask) => {
					cmpTaskErrs.push(errTask);
				});
				
			}
			
			console.log("ALL COMP ITEMS HAVE BEEN PROCESSED")
		} else {
			//DO NOTHING
		}
		
	} else {
		console.log("Array is empty.  No Tasks to add");
	} 
	
}

async function process3DTasks(thrDArr, entOBJ, projID, tasktype) {
	
	
	if (entOBJ != "None") {
		
		for (var x=0; x < thrDArr.length; x++) {
			
			await create3DTask(entOBJ.id, projID, thrDArr[x], tasktype)
			.then(taskItemEnt => {
				console.log("Item " + taskItemEnt.data.name + " successfully added.")
			}).catch((errTask) => {
				thrDTaskErrs.push(errTask);
			});
			
		}
		
		console.log("ALL 3D ITEMS HAVE BEEN PROCESSED");
	} else {
		//DO NOTHING
	}
	
	
	
}

function checkEmptyRows() {
	
	return new Promise(function (resolve, reject) {
		
		// var cmptable = document.getElementById("comptablebody");
		// var thdtable = document.getElementById("threedtablebody");
		
		// var cmptggle = document.getElementById("compswitch");
		// var threedtggle = document.getElementById("threedswitch");
		
		
		// if (cmptggle.classList.contains("toggle-on")){
		
		//     for (var i = cmptable.rows.length-1; i >= 1; i--) {
		//         var currrow = cmptable.rows[i];
		//         var rwchild = currrow.children[0].children[0];
		
		
		//         if (rwchild.innerHTML.length == 0) {
		//             currrow.remove();
		//         }
		
		//     }
		// }
		
		// if (threedtggle.classList.contains("toggle-on")){
		
		//     for (var j = thdtable.rows.length-1; j >= 1; j--) {
		//         var currtdrow = thdtable.rows[j];
		//         var rwtdchild = currtdrow.children[0].children[0];
		
		//         if (rwtdchild.innerHTML.length == 0) {
		//             currtdrow.remove();
		//         }
		
		//     }
		// }
		
		resolve(true)
	});
	
	
}

function checkToggles() {
	
	return new Promise(function (resolve, reject) {
		
		var cmptggle = document.getElementById("compswitch");
		var threedtggle = document.getElementById("threedswitch");
		
		// var multitggle = document.getElementById("standaloneswitch");
		var multidd = $('#multiteamsselect').find(":selected").text();
		
		var multifield = document.getElementById("standalonefield");
		
		console.log(multidd);
		if (multidd !== "Standard" && multifield.value.length == 0) {
			//THROW ERROR HERE OR TOGGLE OFF
			reject(ERROR_MISSING_MULTICOMP)
		}
		
		// if (threedtggle.classList.contains("toggle-on")) {
		//     if (document.getElementById("threedtablebody").rows.length == 0) {
		//         // threedtggle.click();
		//         // toggleVis3DTasks();
		
		//     }
		// }
		
		// if (cmptggle.classList.contains("toggle-on")) {
		//     if (document.getElementById("comptablebody").rows.length == 0) {
		//         // cmptggle.click();
		//         // toggleVisCompTasks();
		//     }
		// }
		
		resolve(true) 
	});
	
	
	
}

function checkShotStructure() {
	
	return new Promise(function (resolve, reject) {
		
		var shottitle = document.getElementById("searchbar");
		var splittitle = shottitle.value.split("_");
		
		if (splittitle.length <= 1) {
			//THROW ERROR FOR IMPROPER STRUCTURE
			reject(ERROR_SHORT_TITLE)
		}
		
		if (parseInt(splittitle[0]) == NaN) {
			//THROW ERROR FOR NUMBER
			reject(ERROR_NOTNUM)
		}
		
		var prefixlen = splittitle[0].split("").length;
		if (prefixlen !== 4) {
			reject(ERROR_NOTNUM)
		}
		
		resolve(true)
	});
	
	
}

function triggerRiveStart(){
	var rc = document.getElementById("rivcontainer");
	rc.classList.add("rive-cont-on");
	rc.classList.remove("rive-cont-off");
	
	//INIT RIVE ANIM
	txtActionLoops("RunLoopA", 1);
	txtActionLoops("RunLoopB", 2);
	fireAnim("startAnim");
}

function blurBGElements() {
	//GET UI CONTAINERS AND DEFOCUS
	var mc = document.getElementById("maincontainer");
	var sc = document.getElementById("secondarycontainer");
	var spcr = document.getElementById("spacer");
	
	mc.classList.add("main-container-blur");
	sc.classList.add("secondary-container-blur");
	spcr.classList.add("linesep-blur");
}

function triggerFailure(theerror) {
	
	adjustTxtRuntimes("RunError", theerror);
	adjustTxtRuntimes("RunSuccess", "Tasks Need Attention");
	
	
	setTimeout(function() {
		fireAnim("stopAnim");
		fireAnim("sendErr");
	}, 2000);
}


function entityParse (inc_entity, session) {
	
	// QUERY CURRENT ENTITY NAME
	var entRequest = session.query(
		'select name, parent from ' + inc_entity.type + ' where id is "' + inc_entity.id + '" limit 1' 
	);
	
	Promise.all([entRequest]).then(function (values) {
		
		var newentity;
		var parentCheck = values[0].data[0].parent.__entity_type__;
		
		if (parentCheck == "Show_package") {
			
			newentity = {
				'id': values[0].data[0].id,
				'type': "TypedContext"
			};
			
			console.log("Responding entity is", newentity);
			
			
			
		} else if (parentCheck == "Production") {
			
			newentity = {
				'id': values[0].data[0].parent.id,
				'type': "TypedContext"
			};
			
			console.log("Responding entity is", newentity);
		}
		
		return newentity
	})
}