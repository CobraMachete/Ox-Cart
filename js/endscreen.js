
var theRive;

function computeSize() {
    theRive.resizeDrawingSurfaceToCanvas();
}

function initRive() {

    var rivinst = new rive.Rive({
        src: "assets/shots_end_screen.riv",
        canvas: document.getElementById("canvas"),
        autoplay: true,
        artboard: "Artboard",
        layout: new rive.Layout({fit: rive.Fit.FitWidth,
            alignment: rive.Alignment.TopCenter,
        }),
        stateMachines: 'State Machine 1',
        onLoad: () => {

            computeSize();
            // rivinst.resizeDrawingSurfaceToCanvas();
            console.log("Loaded Rive...");
            
        },

        
    });

    theRive = rivinst;
    console.log(theRive)
    theRive.on(rive.EventType.RiveEvent, onRiveEventReceived);

    
    
}

function fireAnim(str) {
    console.log(theRive.stateMachineInputs('State Machine 1'));
    var rivinputs = theRive.stateMachineInputs('State Machine 1');

    if (str == "startAnim") {
        console.log("Running startup")
        rivinputs.find(i => i.name === 'bootup').fire();;
        
    }

    if (str == "stopAnim") {
        var stopAnim = rivinputs.find(i => i.name === 'trigger_stop');
        stopAnim.fire();
    }

    if (str == "sendErr") {
        var sendErr = rivinputs.find(i => i.name === 'hasErr');
        sendErr.fire();
    }

    if (str == "closeRiv") {
        var closeRiv = rivinputs.find(i => i.name === 'closeScreen');
        closeRiv.fire();
    }

    
}

function mapRiveInputs(rv) {

    var inpts = rv.stateMachineInputs('State Machine 1');

    inpts.forEach(i => {
        const inputName = i.name;
        const inputType = i.type;
        console.log(inputName, inputType);
    });

    console.log(theRive.getTextRunValue("RunLoopA"));
    console.log(theRive.getTextRunValue("RunLoopB"));
    console.log(theRive.getTextRunValue("RunSuccess"));
    console.log(theRive.getTextRunValue("RunError"));
}

function adjustTxtRuntimes(txtruntime, str) {
    theRive.setTextRunValue(txtruntime, str);
}

function loopReadout(data) {
    console.log(data)
}

function onRiveEventReceived(riveEvent) {
    const eventData = riveEvent.data;
    const eventProperties = eventData.properties;
    console.log(eventData);

    //OUT BUTTON CLICK
    if (eventData.name === "clickBtnOut") {
        //RESET INTERFACE
        clearEndAndReset();
    }

    //TEXT LOOP A COMPLETED
    if (eventData.name === "txtALoop") {
        //RESET INTERFACE
        console.log("The A text has finished a loop");
        txtActionLoops("RunLoopA", 1);
    }

    //TEXT LOOP B COMPLETED
    if (eventData.name === "txtBLoop") {
        //RESET INTERFACE
        console.log("The B text has finished a loop");
        txtActionLoops("RunLoopB", 2);
    }
}

function txtActionLoops(currtxtruntime, databankoption) {
    
    const txtactionsone = [
        "Assembling Unicorns...",
        "Banishing Doughnuts...",
        "Taming Rainbows...",
        "Conjuring Confetti...",
        "Organizing Pandas...",
        "Launching Burritos...",
        "Crafting Llamas...",
        "Decoding Jellyfish...",
        "Polishing Goblins...",
        "Translating Clouds...",
        "Reviving Robots...",
        "Juggling Noodles...",
        "Befriending Marshmallows...",
        "Tickling Dragons...",
        "Baking Thunder...",
        "Chasing Shadows...",
        "Inventing Naps...",
        "Sketching Wormholes...",
        "Counting Snowflakes...",
        "Brewing Daydreams...",
        "Popping Balloons...",
        "Tracking Bigfoot...",
        "Translating Pizza...",
        "Debugging Dragons...",
        "Riding Comets...",
        "Petting Lightning...",
        "Tickling Shadows...",
        "Aligning Quarks...",
        "Hiding Penguins...",
        "Frosting Time...",
        "Doodling Suns...",
        "Feeding Gremlins...",
        "Unraveling Tacos...",
        "Kissing Clouds...",
        "Refactoring Dreams...",
        "Juggling Stars...",
        "Melting Icebergs...",
        "Building Rainbows...",
        "Carving Wishes...",
        "Breeding Cupcakes...",
        "Encouraging Nebulas..."
    ];

    const txtactionstwo = [
        "Harvesting Moonlight...",
        "Spinning Spaghetti...",
        "Wrangling Butterflies...",
        "Encrypting Dreams...",
        "Dancing with Ghosts...",
        "Melting Rainbows...",
        "Painting with Fog...",
        "Exploding Pineapples...",
        "Herding Stardust...",
        "Singing with Owls...",
        "Bottling Sunshine...",
        "Tickling Tornadoes...",
        "Unleashing Glitter...",
        "Bouncing Cupcakes..",
        "Hatching Rainbows...",
        "Teleporting Marshmallows...",
        "Whispering to Whales...",
        "Baking Nebulas...",
        "Mixing Moonbeams...",
        "Cloning Jellybeans...",
        "Summoning Noodles...",
        "Brewing Giggles...",
        "Inventing Shadows...",
        "Sculpting Clouds...",
        "Tickling Penguins...",
        "Cooking Stardust...",
        "Swirling Marshmallows...",
        "Chasing Fireflies...",
        "Balancing Pancakes...",
        "Synchronizing Cupcakes...",
        "Programming Unicorns...",
        "Whispering to Stars...",
        "Scribbling on Dreams...",
        "Juggling Puddles...",
        "Crocheting Galaxies...",
        "Organizing Wormholes...",
        "Flipping Rainbows...",
        "Launching Kittens...",
        "Hugging Meteors..."
    ];

    if (databankoption == 1) {
        var maxnum = txtactionsone.length;
        var wordselection = getRandomInt(maxnum);
        var theword = txtactionsone[wordselection];
        adjustTxtRuntimes(currtxtruntime, theword);
    }

    if (databankoption == 2) {
        var maxnum = txtactionstwo.length;
        var wordselection = getRandomInt(maxnum);
        var theword = txtactionstwo[wordselection];
        adjustTxtRuntimes(currtxtruntime, theword);
    }
}


function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}




