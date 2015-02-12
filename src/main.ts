//# sourceMappingURL=main.js.map
/// <reference path="../lib/jquery.d.ts" />
/// <reference path="../lib/bootstrap.d.ts" />
/// <reference path="../lib/ace.d.ts" />
/// <reference path="../lib/ccs.d.ts" />
/// <reference path="gui/project.ts" />
/// <reference path="gui/menu.ts" />
/// <reference path="gui/menu/pdf_export.ts" />
/// <reference path="gui/storage.ts" />
/// <reference path="gui/examples.ts" />
/// <reference path="activity/activity.ts" />
/// <reference path="activity/activityhandler.ts" />
/// <reference path="activity/editor.ts" />
/// <reference path="activity/explorer.ts" />
/// <reference path="activity/verifier.ts" />
/// <reference path="activity/game.ts" />
/// <reference path="gui/trace.ts" />

declare var CCSParser;
declare var HMLParser;
import ccs = CCS;
import hml = HML;

var isDialogOpen = false;
var canvas;
var traceWidth;
var traceHeight;

var project = new Project();

module Main {

    export var activityHandler;

    export function setup() {
        
        /*var resizeTimer;
        $(window).resize(function () {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => gameActivity.resizeCanvas(), 100);
        });*/
        
        activityHandler = new Activity.ActivityHandler();
        activityHandler.addActivity("editor", new Activity.Editor("#editor-container", "#edit-btn"));
        activityHandler.addActivity("explorer", new Activity.Explorer("#explorer-container", "#explore-btn"));
        activityHandler.addActivity("verifier" , new Activity.Verifier("#verifier-container", "#verify-btn"));
        //activityHandler.addActivity("game", new Activity.BisimulationGame("#game-container", "#game-btn"));
        activityHandler.selectActivity("editor");

        new New('#new-btn', null, project, activityHandler);

        var saveIds = {
            saveFileId: '#save-file-btn',
            saveProjectsId: '#save-projects-btn'
        };
        new Save(null, saveIds, project, activityHandler);

        var loadIds = {
            loadFileId: '#load-file-btn',
            fileInputId: '#file-input',
            projectsId: '#projects-list',
            examplesId: '#examples-list'
        };
        new Load(null, loadIds, project, activityHandler);

        var deleteIds = {
            deleteId: '#delete-list',
        }
        new Delete(null, deleteIds, project, activityHandler);

        new PdfExport("#export-pdf-btn", null, project, activityHandler);        
    }

    /*export class ActivityHandler {
        private currentActivityName = "";
        private activities = {};

        public constructor() {}

        public addActivity(name: string, activity: Activity.Activity, setupFn: (callback) => void, containerId: string, buttonId: string) {
            if (this.activities[name]) throw new Error("Activity with the name '" + name + "' already exists");
            this.activities[name] = {
                activity: activity,
                setupFn: setupFn,
                containerId: containerId,
                buttonId: buttonId
            };
            this.setupHandlingOfUI(name);
        }

        private setupHandlingOfUI(activityName : string) {
            var data = this.activities[activityName],
                handler = this;
            $("#" + data.buttonId).on("click", () => {
                handler.selectActivity(activityName);
            });
        }

        private closeActivity(activityName : string) {
            var activityData = this.activities[activityName],
                activity = activityData.activity;
            activity.beforeHide();
            $("#" + activityData.buttonId).removeClass("active");
            $("#" + activityData.containerId).hide();
            activity.afterHide();
        }

        private openActivity(activityName : string, configuration : any) {
            var data = this.activities[activityName],
                activity = data.activity;
            activity.beforeShow(configuration);
            $("#" + data.buttonId).addClass("active");
            $("#" + data.containerId).show();
            activity.afterShow();
        }

        public openActivityWithConfiguration(activityName : string, configuration) {
            if (this.currentActivityName) {
                this.closeActivity(this.currentActivityName);
            }
            this.currentActivityName = activityName;
            this.openActivity(activityName, configuration); 
        }

        public selectActivity(newActivityName : string): void {
            var newActivityData, callback;
            newActivityData = this.activities[newActivityName];
            if (!newActivityData) return;
            callback = (configuration) => {
                //Did it want to open?
                if (!configuration) return;
                this.openActivityWithConfiguration(newActivityName, configuration);            
            };
            newActivityData.setupFn(callback);
        }
    }*/

    export function getProgram() : string {
        return project.getCCS();
    }

    export function getGraph() {
        var graph : ccs.Graph = new CCS.Graph(),
            bad = false;
        try {
            CCSParser.parse(project.getCCS(), {ccs: CCS, graph: graph});
            bad = graph.getErrors().length > 0;
        } catch (error) {
            bad = true;
        }
        if (bad) {
            graph = null;
        }
        return graph;
    }

    export function getStrictSuccGenerator(graph : ccs.Graph) : ccs.SuccessorGenerator {
        return CCS.getSuccGenerator(graph, {succGen: "strong", reduce: true});
    }

    export function getWeakSuccGenerator(graph : ccs.Graph) : ccs.SuccessorGenerator {
        return CCS.getSuccGenerator(graph, {succGen: "weak", reduce: true});
    }
}

/*function setupExplorerActivityFn(callback): any {
    var graph = Main.getGraph();

    if (!graph) {
        showExplainDialog("Invalid Program", "Invalid CCS program. Do you have syntax errors?");
        return callback(null);
    }

    if (graph.getNamedProcesses().length === 0) {
        showExplainDialog("No Named Processes", "There must be at least one named process in the program to explore.");
        return callback(null);
    }

    console.log("test");
}

function setupGameActivityFn(callback) : any {
    var namedProcesses = Main.getGraph().getNamedProcesses(),
        $succList = $("#game-mode-dialog-succ-list"),
        $processAList = $("#game-mode-dialog-processa"),
        $processBList = $("#game-mode-dialog-processb"),
        $dialog = $("#game-mode-dialog");
    //Important only one dialog at a time.
    if (isShowingDialog()) return callback(null);
    //First are they any named processes at all?
    if (namedProcesses.length === 0) {
        showExplainDialog("No Named Processes", "There must be at least one named process in the program to explore.");
        return callback(null);
    }

    function makeConfiguration(processNameA, processNameB) {
        var graph = Main.getGraph();
        var succlist = $("#game-mode-dialog-succ-list");
        var succGenName = succlist.find("input[type=radio]:checked").attr('id');
        var succGenerator = getSuccGen(succGenName, graph);
        var isWeakSuccGen = succlist.find("input[type=radio]:checked").attr('id') === "weak";
        
        return {
            graph: graph,
            successorGenerator: succGenerator,
            isWeakSuccessorGenerator: isWeakSuccGen,
            processNameA: processNameA,
            processNameB: processNameB
        };
    }

    $processAList.children().remove();
    $processBList.children().remove();

    namedProcesses.sort().forEach(processName => {
        var $elementA = $(document.createElement("option"));
        var $elementB = $(document.createElement("option"));
        $elementA.text(processName);
        $elementB.text(processName);
        
        $processAList.append($elementA);
        $processBList.append($elementB);
    });

    function getSuccGen(succGenName, graph) {
        if(succGenName === "weak") {
            return Main.getWeakSuccGenerator(graph);
        } else if (succGenName === "strong") {
            return Main.getStrictSuccGenerator(graph);
        } else {
            throw "Wrong successor generator name";
        }
        
    }

    var $startBtn = $("#start-btn");
    $startBtn.on("click", () => {
        $dialog.modal("hide");
        callback(makeConfiguration(
            $processAList.val(),
            $processBList.val()
        ));
    });

    $dialog.modal("show");
}*/

function showExplainDialog(title: string, message: string): void {
    var $dialog = $("#explain-dialog"),
        $dialogTitle = $("#explain-dialog-title"),
        $dialogBodyPar = $("#explain-dialog-body-par");
    $dialogTitle.text(title);
    $dialogBodyPar.text(message);
    $dialog.modal("show");
}
