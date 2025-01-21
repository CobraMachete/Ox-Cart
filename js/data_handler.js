var teams_data;
var shots_data;
var selected_data;
var thumbnailwhitelist = [];


fetch('./temp_data/shotsinfo.json').then((response) => response.json()).then((json) => readShotsJson(json));
fetch('./temp_data/teamsinfo.json').then((response) => response.json()).then((json) => readTeamsJson(json));


function readShotsJson(jsonfile) {

    shots_data = jsonfile.shotswhitelist;
    
}

function readTeamsJson(jsonfile) {

    teams_data = jsonfile;
    var keys = Object.keys(teams_data)
    

    dropdownpopulate(teams_data);
    taskdropdownpopulate();
}

function buildThumbList(props) {
    console.log("========================================     CURRENT PROPERTY IS    ========================================================================");
    console.log(props);
    // var prop = "nba";
    var prop = props;
    var datakeys = Object.keys(teams_data);
    
    for (var x=0; x < datakeys.length; x++) {
        
        if (datakeys[x].toLowerCase() == prop.toLowerCase()) {

            var activeProp = teams_data[datakeys[x]];
           
            for (var i=0; i < activeProp.length; i++) {
                thumbnailwhitelist.push(activeProp[i].tricode);
            }

            break;
        }
    }

    console.log(thumbnailwhitelist);
    
}


function readsearchbox() {
    var shotsearchbox = document.getElementById("searchbar");
    
}

//EXCEL COLUMN PASTING FUNCTION (NOT FTRACK READY)
function excelToTable(event, seltable) {

    // get the clipboard text
    event.preventDefault();
    var clipboardData = event.clipboardData || window.clipboardData;
    var clipText = clipboardData.getData('Text');
    
    clipRows = clipText.split('\n');
    

    for (i=0; i < clipRows.length; i++) {
        clipRows[i] = clipRows[i].replace('\r',"");
        clipRows[i] = clipRows[i].split(String.fromCharCode(9));
        
        
    }

    
    
    for (i=0; i<clipRows.length - 1; i++) {

        newRow = seltable.insertRow();
        newRow.removeAttribute("style");
        newRow.setAttribute("onclick", `onRowSelected("comptablebody", ${newRow.rowIndex}, event)`);

        for (j=0; j<clipRows[i].length; j++) {

            newCell = newRow.insertCell();
            // newCell.contentEditable = true;

            var newInput = document.createElement("input");
            newInput.type = "text";
            newInput.placeholder = "Enter Task Name";
            newInput.style.width = "85px";
            newCell.appendChild(newInput);

            if (clipRows[i][j].length == 0) {
                newInput.value = ' ';
            }
            else {
                var txtbase = clipRows[i][j];
                var sanitized_txt = sanitizestring(txtbase);
                newInput.value = sanitized_txt.toUpperCase();
                
            }
        }
        seltable.appendChild(newRow)
    }

    document.dispatchEvent(new MouseEvent('mousedown'));
}

function excelToDotsTable(event, seltable) {

    // get the clipboard text
    event.preventDefault();
    var clipboardData = event.clipboardData || window.clipboardData;
    var clipText = clipboardData.getData('Text');
    
    clipRows = clipText.split('\n');
    

    for (i=0; i < clipRows.length; i++) {
        clipRows[i] = clipRows[i].replace('\r',"");
        clipRows[i] = clipRows[i].split(String.fromCharCode(9));
        
        
    }

    
    
    for (i=0; i<clipRows.length - 1; i++) {

        newRow = seltable.insertRow();
        newRow.removeAttribute("style");
        newRow.setAttribute("onclick", `onRowSelected("threedtablebody", ${newRow.rowIndex}, event)`);

        for (j=0; j<clipRows[i].length; j++) {

            newCell = newRow.insertCell(0);
            // newCell.contentEditable  = true;

            var newInput = document.createElement("input");
            newInput.type = "text";
            newInput.placeholder = "Enter Task Name";
            newInput.style.width = "85px";
            newCell.appendChild(newInput);

            var newCellDots = newRow.insertCell(1);
            newCellDots.style.paddingLeft = "15px";
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

            if (clipRows[i][j].length == 0) {
                newInput.value = ' ';
            }
            else {
                var txtbase = clipRows[i][j];
                var sanitized_txt = sanitizestring(txtbase);
                newInput.value = sanitized_txt.toUpperCase();
            }
        }
        seltable.appendChild(newRow)
    }
    

    updateRowRadios();
    document.dispatchEvent(new MouseEvent('mousedown'));
}

function dropdownpopulate(data) {

    
    var franchisecontent = document.getElementById("ddcontentstageone");
    var franchiseselector = document.getElementById("startselection");

    var keys = Object.keys(data);

    for (var i=0; i < keys.length; i++) {

        var newOption = document.createElement("option");
        newOption.value = (i+1).toString();
        newOption.text = keys[i].toUpperCase();
        newOption.onclick = function () {setFranchise(franchiseselector, this.innerHTML, keys.length, newOption.value)};
        
        
        franchisecontent.appendChild(newOption);
    }

    //MANUALLY ADDING IN SPORTS MISSING FROM DATABASE
    //SEPARATOR
    var optsep = document.createElement("option");
    optsep.value = (keys.length + 1).toString();
    optsep.text = "________";
    optsep.disabled = true;

    //ADDING SOCCER
    var ussfopt = document.createElement("option");
    ussfopt.value = (keys.length + 2).toString();
    ussfopt.text = "SOCCER";
    ussfopt.onclick = function () {setFranchise(franchiseselector, this.innerHTML, keys.length, ussfopt.value)};
    
    
    //ADDING NASCAR
    var nascaropt = document.createElement("option");
    nascaropt.value = (keys.length + 3).toString();
    nascaropt.text = "NASCAR";
    nascaropt.onclick = function () {setFranchise(franchiseselector, this.innerHTML, keys.length, nascaropt.value)};
    
    franchisecontent.append(optsep);
    franchisecontent.append(ussfopt);
    franchisecontent.append(nascaropt);

    franchiseselector.innerHTML = "NBA"
    
}

function taskdropdownpopulate() {

    var franchiseselector = document.getElementById("startselection");
    var selectioncontent = document.getElementById("ddcontentstagetwo");
    var itemselector = document.getElementById("startselectiontwo");

    var itemlist = ["Tricode", "City", "Team Name", "Team Full Name"];

    for (var i=0; i < itemlist.length; i++) {

        var newOption = document.createElement("option");
        newOption.value = (i+1).toString();
        newOption.text = itemlist[i];
        newOption.onclick = function () {setTaskDD(itemselector, this.innerHTML)};
        
        selectioncontent.appendChild(newOption);
    }


}

function setFranchise(selector, text, numkeys, opval) {

    var bc = document.getElementById("breadcont");
    var themantxt = document.getElementById("mantxt");
    var itemselector = document.getElementById("startselectiontwo");
    var optnums = numkeys;
    var curroptval = parseInt(opval);

    // console.log("Number of database keys:")
    // console.log(optnums)
    // console.log(curroptval)
    // console.log(selector.value)

    if (curroptval <= optnums) {

        selector.innerHTML = text;
        $("#ddcontentstageone").hide();

        //SHOWING SECOND DROPDOWN BC DATABASE ITEMS DO EXIST
        themantxt.classList.add("manual-txt");
        themantxt.classList.remove("manual-txt-on");
        $("#btntxt").show();
        $("#ddstagetwo").show();
        noDataEntries = false;

        bc.style.backgroundPositionX = "-205px";

        setTaskDD(itemselector, itemselector.innerHTML);

    }else {
        
        selector.innerHTML = text;
        $("#ddcontentstageone").hide();

        //HIDING SECOND DROPDOWN BC NO DATABASE ITEMS EXIST
        $("#btntxt").hide();
        $("#ddstagetwo").hide();
        themantxt.classList.remove("manual-txt");
        themantxt.classList.add("manual-txt-on");
        noDataEntries = true;

        bc.style.backgroundPositionX = "-170px";
    }

    document.dispatchEvent(new MouseEvent('mousedown'));
}

function setTaskDD(chosenitem, chosentext) {

    selected_data = [];
    chosenitem.innerHTML = chosentext;

    var franchiseselector = document.getElementById("startselection");
    var sportprop = franchiseselector.innerHTML.toLowerCase();
    var itemtask = chosenitem.innerHTML.toLowerCase();

    if (itemtask == "tricode") {
        var objitem = "tricode";
    }

    if (itemtask == "city") {
        var objitem = "city";
    }

    if (itemtask == "team name") {
        var objitem = "name";
    }

    if (itemtask == "team full name") {
        var objitem = "full_name";
    }

    var thebtntxt = document.getElementById("btntxt");
    thebtntxt.innerHTML = "+ Add Every " + chosenitem.innerHTML;

    //UPDATE GLOBAL VAR TO PREVIOUS SELECTION
    prevTaskData = chosenitem.innerHTML;

    for (var x = 0; x < teams_data[sportprop].length; x++) {
        selected_data.push(teams_data[sportprop][x][objitem])
    }
    
    $("#ddcontentstagetwo").hide()
    var thebtn = document.getElementById("btntxt");
    thebtn.classList.add("btn-txt-on");

    totalStartRows = 0;

    //EVENT LISTENER FOR ADDING PREVIEW TO COLUMNS ON HOVER
    thebtn.addEventListener("mouseover", function(event) {

        var cmptsklist = document.getElementById("comptablebody");
        var thrdtsklist = document.getElementById("threedtablebody");
        var currcmptasks = cmptsklist.rows.length;
        var curr3Dtasks = thrdtsklist.rows.length;

        for (j=0; j < selected_data.length; j++) {
            
            currRow = currcmptasks + j;
            newRow = cmptsklist.insertRow(currRow);
            newRow.style.fontStyle = "italic";
            newRow.style.fontWeight = "100";
            newRow.style.color = "rgba(190, 190, 190)";
            newRow.style.opacity = 0.4;
            newCell = newRow.insertCell();

            var txtbase = selected_data[j];
            var sanitized_txt = txtbase.replace(" ", "_");

            newCell.innerText = sanitized_txt.toUpperCase();
            cmptsklist.appendChild(newRow)

            ghostcomptasks.push(cmptsklist.rows[currRow]);
            
        }

        
        for (i=0; i < selected_data.length; i++) {

            currRow = curr3Dtasks + i;
            newRow = thrdtsklist.insertRow(currRow);
            newRow.style.fontStyle = "italic";
            newRow.style.fontWeight = "100";
            newRow.style.color = "rgba(190, 190, 190)";
            newRow.style.opacity = 0.4;
            newCell = newRow.insertCell();

            var txtbase = selected_data[i];
            var sanitized_txt = txtbase.replace(" ", "_");

            newCell.innerText = sanitized_txt.toUpperCase();
            thrdtsklist.appendChild(newRow)

            ghost3Dtasks.push(thrdtsklist.rows[currRow]);
        }
        
    });

    thebtn.addEventListener("click", function(event) {
        clickedInside = true;
        removeGhostRows();
        addAllPreviewTasks();
    });

    //EVENT LISTENER FOR REMOVING PREVIEW TO COLUMNS ON MOUSE EXIT
    thebtn.addEventListener("mouseleave", function(event) {

        if (clickedInside == true) {
            clickedInside = false;
        } else {
            removeGhostRows();
        }
        
        
    });

}

function removeGhostRows() {

    for (t=ghostcomptasks.length-1; t >= 0 ; t--) {

        ghostcomptasks[t].remove();
        
    }

    for (h=ghost3Dtasks.length-1; h >=0 ; h--) {

        ghost3Dtasks[h].remove();
    }

    ghostcomptasks = [];
    ghost3Dtasks = [];
}


function sanitizestring(str) {
    var snstr = str.replace(" ","_");
    return snstr
}




