function getcontainerwidth() {
    const maincont = document.getElementById("secondarycontainer");
    const spacer = document.getElementById("spacer");
    const width = maincont.offsetWidth;
    const height = maincont.offsetHeight;

    spacer.style.height = (height / 2)+ "px";
    spacer.style.left = (width - 10)  + "px";
    spacer.style.top = ((height / 4)+80) + "px";

};

//SEARCH BAR FUNCTION FOR SHOTS
function addToShotField(item) {

    var firstTd = item.querySelector('td');
    var content = firstTd.textContent; 

    var infield = document.getElementById("searchbar");
    infield.value = content;

    // console.log(infield.value)

    $('#shotstable').hide();
    document.dispatchEvent(new MouseEvent('mousedown'));
    
}

//SPORT DROPDOWN POPULATE FUNCTION
function dropdownpopulate(data) {

    var franchisecontent = document.getElementById("ddcontentstageone");
    var franchiseselector = document.getElementById("startselection");

    var keys = Object.keys(data);

    for (var i=0; i < keys.length; i++) {
        var newOption = $("<option></option>").val(i).text(keys[i].toUpperCase());
        franchisecontent.append(newOption);
    }


}

//TURNING 3D TABLE ON AND OFF BASED ON TOGGLE
function toggleVis3DTasks() {

    var bottomrow = document.getElementById("threedcolumnrowcontainer");
    var threedcolumn = document.getElementById("threedtaskgroup");

    if (threedcolumnvis == false) {
        threedcolumnvis = true;
        threedcolumn.classList.remove("threedtaskgroupoff")
        bottomrow.classList.remove("columnrowcontaineroff")
    } else {
        threedcolumnvis = false;
        threedcolumn.classList.add("threedtaskgroupoff")
        bottomrow.classList.add("columnrowcontaineroff")
    }

    setTimeout(function() {
        mouseEvt();
    }, 100);
    
}

//TURNING COMP TABLE ON AND OFF BASE ON TOGGLE
function toggleVisCompTasks() {

    var bottomrow = document.getElementById("taskcolumnrowcontainer");
    var compcolumn = document.getElementById("comptaskgroup");

    if (compcolumnvis == false) {
        compcolumnvis = true;
        compcolumn.classList.remove("comptaskgroupoff")
        bottomrow.classList.remove("columnrowcontaineroff")
    } else {
        compcolumnvis = false;
        compcolumn.classList.add("comptaskgroupoff")
        bottomrow.classList.add("columnrowcontaineroff")
    }

    setTimeout(function() {
        mouseEvt();
    }, 100);
}

//ADDING SINGLE COMP TASK FROM BUTTON
function addSingleCompTask() {


    var the3daddbtn = document.getElementById("thrdaddbtn");
    var thdtggl = document.getElementById("threedswitch");
    var tblebody = document.getElementById("comptablebody");

    newRow = tblebody.insertRow();
    newRow.setAttribute("onclick", `onRowSelected("comptablebody", ${newRow.rowIndex}, event)`);
    newCell = newRow.insertCell();

    var newInput = document.createElement("input");
    newInput.id = "cmpinpt" + (tblebody.rows.length+1);
    newInput.type = "text";
    newInput.placeholder = "Task Name";
    newCell.appendChild(newInput);
    
    tblebody.appendChild(newRow);

    totCompTasks += 1

    
    newInput.addEventListener('change', function(e) {
        theinputval = newInput.value;
        theinputval = sanitizestring(theinputval);
        newInput.value = theinputval.toUpperCase();

        setTimeout(function() {
            checkForDuplicateTasks(tblebody);
        }, 500);
        
        
    });

    newInput.addEventListener('blur', function(e) {

        fieldval = newInput.value;

        if (fieldval.length === 0) {
            parEl = this.parentElement.parentElement;
            parEl.remove();

        
            
        }
        
    });

    //EVENT LISTENER FOR MOVING TO NEXT CELL
    newInput.addEventListener('keydown', (event) => {
        
        if (document.activeElement.id == newInput.id) {
            console.log(document.activeElement.id);
            if (event.key == "Enter"){
                addSingleCompTask();
            }
            // if (event.key == "Tab"){
                
            //     if (!thdtggl.classList.contains("toggle-on")) {

            //         thdtggl.click();
            //         addSingle3DTask();

            //     } else {
            //         addSingle3DTask();
            //     }
                
            // }
        }
        
    });

    
    
    newInput.focus();
    

    document.dispatchEvent(new MouseEvent('mousedown'));

}



//ADDING SINGLE 3D TASK FROM BUTTON
function addSingle3DTask() {
    
    

    var cmptggl = document.getElementById("compswitch");
    var tblebody = document.getElementById("threedtablebody");

    newRow = tblebody.insertRow();
    newRow.setAttribute("onclick", `onRowSelected("threedtablebody", ${newRow.rowIndex}, event)`);
    newCell = newRow.insertCell(0);
    // newCell.contentEditable  = true;

    var newInput = document.createElement("input");
    newInput.id = "thdinpt" + (tblebody.rows.length+1);
    newInput.type = "text";
    newInput.placeholder = "Task Name";
    newInput.style.width = "85px";
    newCell.appendChild(newInput);


    var newCellDots = newRow.insertCell(1);
    newCellDots.style.paddingLeft = "5px";
    var mydiv = document.createElement("div");
    mydiv.classList.add("button-div");

    var imgA = document.createElement("img");
    var imgB = document.createElement("img");
    var imgC = document.createElement("img");
    var imgD = document.createElement("img");
    var imgE = document.createElement("img");

    imgA.classList.add("unchecked-rad");
    imgB.classList.add("unchecked-rad");
    imgC.classList.add("unchecked-rad");
    imgD.classList.add("unchecked-rad");
    imgE.classList.add("unchecked-rad");

    mydiv.appendChild(imgA);
    mydiv.appendChild(imgB);
    mydiv.appendChild(imgC);
    mydiv.appendChild(imgD);
    mydiv.appendChild(imgE);

    newCellDots.appendChild(mydiv);

    
    tblebody.appendChild(newRow);
    

    totCompTasks += 1
    updateRowRadios();

    
    newInput.addEventListener('change', function(e) {
        theinputval = newInput.value;
        theinputval = sanitizestring(theinputval);
        newInput.value = theinputval.toUpperCase();

        setTimeout(function() {
            checkForDuplicateTasks(tblebody);
        }, 500);
        
    });

    newInput.addEventListener('blur', function(e) {

        fieldval = newInput.value;

        if (fieldval.length === 0) {

            parEl = this.parentElement.parentElement;
            parEl.remove();
            
        }
        
    });

    //EVENT LISTENER FOR MOVING TO NEXT CELL
    newInput.addEventListener('keydown', (event) => {
        
        if (document.activeElement.id == newInput.id) {
            console.log(document.activeElement.id);
            if (event.key == "Enter"){
                
                addSingle3DTask();
            }

            // if (event.key == "Tab"){
                
            //     if (!cmptggl.classList.contains("toggle-on")) {

            //         cmptggl.click();
            //         addSingleCompTask();
                    
            //     } else {

            //         addSingleCompTask();
                   
            //     }
                
            // }
        }
        
    });

    
    newInput.focus();

    document.dispatchEvent(new MouseEvent('mousedown'));

}

//CLEAR ALL ROWS FROM TABLE
function removeAllRows(thetable) {

    $(thetable).empty();
    document.dispatchEvent(new MouseEvent('mousedown'));
}

//GHOSTING ITEMS FROM DATABASE INTO TABLES
function addAllPreviewTasks() {

    var tblebody = document.getElementById("comptablebody");
    var threedtblebody = document.getElementById("threedtablebody");
    
    // console.log(selected_data)
    //LOOPING THROUGH COMP TASK TABLE
    for (a=0; a < selected_data.length; a++) {

        var therow = tblebody.insertRow();
        var thecell = therow.insertCell();
        
        var txtbase = selected_data[a];
        var sanitized_txt = txtbase.replace(" ", "_");

        therow.setAttribute("onclick", `onRowSelected("comptablebody", ${therow.rowIndex}, event)`);
        
        var theinput = document.createElement("input");
        theinput.type = "text";
        theinput.placeholder = "Enter Task";
        theinput.value = sanitized_txt.toUpperCase();
        
        thecell.appendChild(theinput);
        
    }

    //LOOPING THROUGH 3D TASK TABLE
    for (x=0; x < selected_data.length; x++) {

        var therow = threedtblebody.insertRow();
        var thecell = therow.insertCell(0);
        
        var txtbase = selected_data[x];
        var sanitized_txt = txtbase.replace(" ", "_");

        therow.setAttribute("onclick", `onRowSelected("threedtablebody", ${therow.rowIndex}, event)`);

        var theinput = document.createElement("input");
        theinput.type = "text";
        theinput.placeholder = "Enter Task";
        theinput.value = sanitized_txt.toUpperCase();;
        theinput.style.width = "85px";

        thecell.appendChild(theinput);

        var dotcell = therow.insertCell(1);
        dotcell.style.paddingLeft = "5px";
        var mydiv = document.createElement("div");
        mydiv.classList.add("button-div");

        var imgA = document.createElement("img");
        var imgB = document.createElement("img");
        var imgC = document.createElement("img");
        var imgD = document.createElement("img");
        var imgE = document.createElement("img");

        imgA.classList.add("unchecked-rad");
        imgB.classList.add("unchecked-rad");
        imgC.classList.add("unchecked-rad");
        imgD.classList.add("unchecked-rad");
        imgE.classList.add("unchecked-rad");

        mydiv.appendChild(imgA);
        mydiv.appendChild(imgB);
        mydiv.appendChild(imgC);
        mydiv.appendChild(imgD);
        mydiv.appendChild(imgE);

        dotcell.appendChild(mydiv);

        
    }

    totCompTasks += selected_data.length;
    totThreeDTasks += selected_data.length;

    document.dispatchEvent(new MouseEvent('mousedown'));

}

//START OF ROW SELECTION LOGIC
function onRowSelected(parentitem, rowInd, evt){
    // console.log(parentitem);
    var theparent = document.getElementById(parentitem);
    var rowObj = theparent.rows[rowInd];
    
    var rwind = rowInd - 1;
    var obj = rowObj;

    if (lastRowClicked == undefined || null) {
        lastRowClicked = rwind;
    } 
    
    
    if (evt.ctrlKey || evt.metaKey){
        rowCtrlClick(theparent, rwind);
    } else if(evt.shiftKey) {
        rowShiftClick(theparent, rwind);
    } else {
        rowStandardClick(theparent, obj, rwind);
    }

}

//ROW SELECTION LOGIC WITH CTRL MODIFIER
function rowCtrlClick(tbleobj, selind) {

    var rwObj = tbleobj.rows[selind];
    lastRowClicked = selind;
    if ($(rwObj).hasClass('row-selected')){

        $(rwObj).removeClass('row-selected');
        
    } else {
        $(rwObj).addClass('row-selected');
    }
}

//ROW SELECTION LOGIC WITH CTRL MODIFIER
function rowShiftClick(tbleobj, selind) {

    if (selind < lastRowClicked) {

        for (var x = selind; x <= lastRowClicked; x++) {
            var currRowObj = tbleobj.rows[x];
            $(currRowObj).addClass('row-selected')
        }

        lastRowClicked = selind;
        
    } else if (selind > lastRowClicked){
       
        for (var i = lastRowClicked; i <= selind; i++) {
            var currRowObj = tbleobj.rows[i];
            $(currRowObj).addClass('row-selected')
        }

        lastRowClicked = selind;
        
    }
}

//ROW SELECTION WITHOUT KEY MODIFIER
function rowStandardClick(tbleobj, rwObj, selind) {

    // console.log(selind);
    var tblebody = tbleobj;
    var numrows = tblebody.rows.length;
    lastRowClicked = selind;
    

    for (var i = 0; i < numrows; i++) {
        if (i !== selind) {
            if ($(tblebody.rows[i]).hasClass('row-selected')){
                $(tblebody.rows[i]).removeClass('row-selected');
            }
        } else {
            if ($(tblebody.rows[i]).hasClass('row-selected')){

                $(tblebody.rows[i]).removeClass('row-selected');
                
            } else {
                $(tblebody.rows[i]).addClass('row-selected');
            }
        }
        
    }

    
    
}

function selectShotNum(shotObj) {

    if ($(shotObj).hasClass("shotnumdim")) {

        $(shotObj).addClass("shotnumselect");
        $(shotObj).removeClass("shotnumdim");

    } else if ($(shotObj).hasClass("shotnumselect")){

        $(shotObj).removeClass("shotnumselect");
        $(shotObj).addClass("shotnumdim");
    }
    
    updateShotsTxt();
    updateRowRadios();
    
}

function updateShotsTxt() {

    var theshots = document.getElementById("threedshots");
    var shotstxt = document.getElementById("mkshotstxt");

    var shotchildren = [];

    for (var x = 0; x < theshots.children.length; x++) {
        shotchildren.push(theshots.children[x].classList);
    }

    if (shotchildren.some(kid => kid.contains("shotnumselect"))) {
        shotstxt.classList.add("makeshotstxtbright");
        shotstxt.classList.remove("makeshotstxt");
    } else {
        shotstxt.classList.add("makeshotstxt");
        shotstxt.classList.remove("makeshotstxtbright");
    }
    
}

function updateRowRadios() {

    var tblbody = document.getElementById("threedtablebody");
    var theshots = document.getElementById("threedshots");
    var shotchildren = [];


    for (var x = 1; x < theshots.children.length; x++) {
        shotchildren.push(theshots.children[x].classList);
    }

    
    for (var i = 0; i < tblbody.rows.length; i++) {
        var currrow = tblbody.rows[i];
        var rowtd = currrow.children[1];
        var rowRadioDiv = rowtd.children[0];
        var rowRads = rowRadioDiv.children;

        for (var j=0; j < shotchildren.length; j++) {

            if (shotchildren[j].contains("shotnumselect")) {
                rowRads[j].classList.add("checked-rad");
                rowRads[j].classList.remove("unchecked-rad");

            } else {
                rowRads[j].classList.add("unchecked-rad");
                rowRads[j].classList.remove("checked-rad");
            }
        }
        
    }

}

function keyboardDeleteRows(thetable) {

    var numrows = thetable.rows.length;

    for (var i = numrows - 1; i >= 0; i--) {

        if (thetable.rows[i].classList.contains("row-selected")) {
            // console.log(i);
            thetable.deleteRow(i);
        }
    }

    var newtablen = thetable.rows.length;
    var tablename = thetable.id.toString();

    //ADJUST ONCLICK FUNCTION FOR EACH ROW
    for (var x = 0; x < newtablen; x++){

        if (tablename == "comptablebody") {
            thetable.rows[x].setAttribute("onclick", `onRowSelected("comptablebody", ${thetable.rows[x].rowIndex}, event)`);
        } else {
            thetable.rows[x].setAttribute("onclick", `onRowSelected("threedtablebody", ${thetable.rows[x].rowIndex}, event)`);
        }
        
    }

    document.dispatchEvent(new MouseEvent('mousedown'));

}

function treeviewHandler() {

    //TREE ELEMENTS
    var mastercont = document.getElementById("treepreview");
    var shotroot = document.getElementById("shottextroot");

    var compfold = document.getElementById("taskrootcomp");
    var threeDfold = document.getElementById("taskroot3D");

    var teamobjcomp = document.getElementById("teamsrootcomp");
    var teamobj3D = document.getElementById("teamsroot3D");

    var teamobjcomptxt = document.getElementById("teamstextcomproot");
    var teamobj3Dtxt = document.getElementById("teamstext3Droot");

    var taskonecomp = document.getElementById("firsttaskcomp");
    var tasktwocomp = document.getElementById("secondtaskcomp");
    var taskmorecomp = document.getElementById("moretaskcomp");

    var taskonecomptxt = document.getElementById("firstcomptext");
    var tasktwocomptxt = document.getElementById("secondcomptext");
    var taskmorecomptxt = document.getElementById("moretaskcomptext");

    var taskone3D = document.getElementById("firsttask3D");
    var tasktwo3D = document.getElementById("secondtask3D");
    var taskmore3D = document.getElementById("moretaskcomp3D");

    var taskone3Dtxt = document.getElementById("first3Dtext");
    var tasktwo3Dtxt = document.getElementById("second3Dtext");
    var taskmore3Dtxt = document.getElementById("moretask3Dtext");

    //OTHER DOCUMENT ELEMENTS
    var thesearchbar = document.getElementById("searchbar");
    var thecompswitch = document.getElementById("compswitch");
    var the3Dswitch = document.getElementById("threedswitch");
    var thestandaloneswitch = document.getElementById("standaloneswitch");
    var thestandalonefield = document.getElementById("standalonefield");

    var thecmptable = document.getElementById("comptablebody");
    var the3Dtable = document.getElementById("threedtablebody");


    var toggle3DisOn = false;
    var toggleCompisOn = false;

    if (the3Dswitch.classList.contains("toggle-on") == true) {
        toggle3DisOn = true;
    }

    if (thecompswitch.classList.contains("toggle-on") == true) {
        toggleCompisOn = true;
    }

    //SETTING SHOT NAME
    if (searchActive == false && thesearchbar.value !== "") {

        shotroot.innerHTML = thesearchbar.value;
        $(mastercont).show();

        //COMP FOLDER VISIBILITY
        if (thecompswitch.classList.contains("toggle-on") == true) {
            $(compfold).show();
        } else {
            
            $(compfold).hide();
        }


        //3D FOLDER VISIBILITY
        if (the3Dswitch.classList.contains("toggle-on")) {
            $(threeDfold).show();
        } else {
            
            $(threeDfold).hide();
        }

        //SETTINGS TEAMS OBJECT TEXT VALUE
        if (thestandalonefield.value !== "" && thestandaloneswitch.classList.contains("toggle-on")) {
            teamobjcomptxt.innerHTML = thestandalonefield.value;
            teamobj3Dtxt.innerHTML = thestandalonefield.value;
        } else if (thestandalonefield.value == "" && thestandaloneswitch.classList.contains("toggle-on")) {
            teamobjcomptxt.innerHTML = "TEAM OBJECT EMPTY";
            teamobj3Dtxt.innerHTML = "TEAM OBJECT EMPTY";
        } else {
            //DO SOMETHING
        }

        //TEAMS OBJECT VISIBILITY
        if (thestandaloneswitch.classList.contains("toggle-on") == true) {
            if (toggleCompisOn == true) {
                $(teamobjcomp).show();
            } else {
                $(teamobjcomp).hide();
            }

            if (toggle3DisOn == true) {
                $(teamobj3D).show();
            } else {
                $(teamobj3D).hide();
            }
            
            

            //MOVE COMP TASK CONTAINERS OVER
            taskonecomp.classList.remove("third-icon-container");
            taskonecomp.classList.add("task-teams-container");

            tasktwocomp.classList.remove("third-icon-container");
            tasktwocomp.classList.add("task-teams-container");

            taskmorecomp.classList.remove("third-icon-container");
            taskmorecomp.classList.add("task-teams-container");

            //MOVE 3D TASK CONTAINERS OVER
            taskone3D.classList.remove("third-icon-container");
            taskone3D.classList.add("task-teams-container");

            tasktwo3D.classList.remove("third-icon-container");
            tasktwo3D.classList.add("task-teams-container");

            taskmore3D.classList.remove("third-icon-container");
            taskmore3D.classList.add("task-teams-container");


        } else {
            $(teamobjcomp).hide();
            $(teamobj3D).hide();

            //MOVE COMP TASK CONTAINERS OVER
            taskonecomp.classList.add("third-icon-container");
            taskonecomp.classList.remove("task-teams-container");

            tasktwocomp.classList.add("third-icon-container");
            tasktwocomp.classList.remove("task-teams-container");

            taskmorecomp.classList.add("third-icon-container");
            taskmorecomp.classList.remove("task-teams-container");

            //MOVE 3D TASK CONTAINERS OVER
            taskone3D.classList.add("third-icon-container");
            taskone3D.classList.remove("task-teams-container");

            tasktwo3D.classList.add("third-icon-container");
            tasktwo3D.classList.remove("task-teams-container");

            taskmore3D.classList.add("third-icon-container");
            taskmore3D.classList.remove("task-teams-container");

        }

        

        //SETTING COMP TASKS PREVIEW NAMES
        if (thecmptable.rows.length >= 1 && toggleCompisOn == true) {

            if (thecmptable.rows.length >= 1 && toggleCompisOn == true) {
                var rwtxt = thecmptable.rows[0].children[0].childNodes[0].value;
                taskonecomptxt.innerHTML = rwtxt;
                $(taskonecomp).show();
            } else {
                $(taskonecomp).hide();
            }

            if (thecmptable.rows.length >= 2 && toggleCompisOn == true) {
                var rwtxt = thecmptable.rows[1].children[0].childNodes[0].value;
                tasktwocomptxt.innerHTML = rwtxt;
                $(tasktwocomp).show();
            } else {
                $(tasktwocomp).hide();
            }

            if (thecmptable.rows.length >= 3 && toggleCompisOn == true) {
                $(taskmorecomp).show();
            } else {
                $(taskmorecomp).hide();
            }

        } else {
            $(taskonecomp).hide();
            $(tasktwocomp).hide();
            $(taskmorecomp).hide();
        }

        

        //SETTING 3D TASKS PREVIEW NAMES
        if (the3Dtable.rows.length >= 1) {

            if (the3Dtable.rows.length >= 1 && toggle3DisOn == true) {
                var rwtxt = the3Dtable.rows[0].children[0].childNodes[0].value;
                taskone3Dtxt.innerHTML = rwtxt;
                $(taskone3D).show();

            } else {
                $(taskone3D).hide();
            }

            if (the3Dtable.rows.length >= 2 && toggle3DisOn == true) {
                var rwtxt = the3Dtable.rows[1].children[0].childNodes[0].value;
                tasktwo3Dtxt.innerHTML = rwtxt;
                $(tasktwo3D).show();
            } else {
                $(tasktwo3D).hide();
            }

            if (the3Dtable.rows.length >= 3 && toggle3DisOn == true) {
                $(taskmore3D).show();
            } else {
                $(taskmore3D).hide();
            }
        } else {
            $(taskone3D).hide();
            $(tasktwo3D).hide();
            $(taskmore3D).hide();
        }

    } else {
        $(mastercont).hide();
    }



}

function mouseEvt() {
    // console.log("TRIGGERED EVENT");
    document.dispatchEvent(new MouseEvent('mousedown'));
}

function delayedMouseEvt() {

    var thebar = document.getElementById("standalone");

    if (thebar.classList.contains("bar-disabled")) {
        thebar.classList.remove("bar-disabled");
    } else {
        thebar.classList.add("bar-disabled");
    }
    
    setTimeout(function() {
        document.dispatchEvent(new MouseEvent('mousedown'));
        
    }, 100);
}

function fieldChanged(obj) {

    theinputval = obj.value;
    theinputval = sanitizestring(theinputval);
    obj.value = theinputval.toUpperCase();
        
}

function swap3DIcon(obj) {
    
    if (obj.id == "mayaicon") {

        if (obj.classList.contains("rowiconon")) {
            //DO NOTHING
        } else {

            var cinemaicon = document.getElementById("c4dicon");
            cinemaicon.classList.remove("rowiconon");
            cinemaicon.setAttribute('src', "img/c4d_icon_off.png");

            obj.classList.add("rowiconon");
            obj.setAttribute('src', "img/maya_icon_on.png");
        }
    }

    if (obj.id == "c4dicon") {

        if (obj.classList.contains("rowiconon")) {
            //DO NOTHING
        } else {
            var mayaappicon = document.getElementById("mayaicon");
            mayaappicon.classList.remove("rowiconon");
            mayaappicon.setAttribute('src', "img/maya_icon_off.png");

            obj.classList.add("rowiconon");
            obj.setAttribute('src', "img/c4d_icon_on.png");
        }
    }
}

function getElMargin() {

    var mnCont = document.getElementById("maincontainer");
    var t = document.getElementById("rivcontainer");
    
    var style = getComputedStyle(mnCont);
    t.style.marginLeft = style.marginLeft;
    
}

function clearEndAndReset() {
    //RESET RIVE CONTAINER
    var rc = document.getElementById("rivcontainer");
    rc.classList.add("rive-cont-off");
    rc.classList.remove("rive-cont-on");

    setTimeout(function() {
         //GET UI CONTAINERS AND DEFOCUS
        var mc = document.getElementById("maincontainer");
        var sc = document.getElementById("secondarycontainer");
        var spcr = document.getElementById("spacer");

        mc.classList.remove("main-container-blur");
        sc.classList.remove("secondary-container-blur");
        spcr.classList.remove("linesep-blur");
        
        location.reload();
    },300)

}

function ddFromCurrProp(prop) {

    var foundSelection = false;
    var francont = document.getElementById("ddcontentstageone");
    

    for (var x = 0; x < francont.children.length; x++) {
        
        if (francont.children[x].text.toUpperCase() == prop.toUpperCase()) {
            foundSelection = true;
            francont.children[x].click();
            break;
        }
    }

}

function makeNewCompRow() {
    addSingleCompTask();
}

function makeNew3DRow() {
    addSingle3DTask();
}

function checkForDuplicateTasks(selectedtable) {

    var tskarr = [];
    var totalrows = selectedtable.rows.length;

    for (var i = 0; i <= totalrows-1; i++) {
        
        tskarr.push(selectedtable.rows[i].children[0].children[0].value)
    }

    var dupes = findDupes(tskarr);

    if (dupes.length > 0) {

        for (var j = dupes.length - 1; j >= 0; j--) {
            var rowidx = dupes[j];
            selectedtable.rows[rowidx].remove();
            
        }
    }
    


}

function findDupes(arr) {
    
    var filteredarr = arr.reduce((acc, value, index) => {
        if (arr.indexOf(value) !== index) {
            acc.push(index);
        }
        return acc;
        }, []);
    
    return filteredarr
} 