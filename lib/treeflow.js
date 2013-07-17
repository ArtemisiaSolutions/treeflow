var events = require('events')
var util = require('util')
var ce = require('cloneextend')


function TreeFlow(flowDefinition) {
    var eventEmitter = new events.EventEmitter()
    var self = this
    var currentFlowDefinition = ce.clone(flowDefinition)

    var stopped = false
    var emmiterCtx
    self.run = function(ctx){
        emmiterCtx=ce.clone(ctx)
        var err = null;
        if(currentFlowDefinition){
            if(currentFlowDefinition.tasks && currentFlowDefinition.tasks.length > 0){
                walk(currentFlowDefinition)
            }else{
                err = new Error("No tasks found in main flow")
                err.name = "NotFoundTasksError"
                launchFatal(err,currentFlowDefinition)
            }
        }else{
            err = new Error("No configuration object found")
            err.name = "NotFoundConfigurationObjectError"
            launchFatal(err,currentFlowDefinition)
        }
    }

    self.on = function(eventName, callback){
        eventEmitter.on(eventName,callback)
    }

    self.stop = function(){
        eventEmitter.emit("stop")
        stopped=true;
    }

    function walk(currentflow) {
        currentflow.stop = function(){
            return checkParentCalling(currentflow);
        }
        var myError = null;
        
        if(currentflow.tasks.length > 1){
            currentflow.execution = "sequential-independent";
        }else{
            currentflow.execution = "sequential";
        }
        
        if(currentflow.execution){
            if(currentflow.execution === "sequential") {
                currentflow.callback = function(err) {
                    if(err){
                        var nextChildren = currentflow.stop()
                        if(nextChildren){
                            var index = nextChildren.status +1
                            executeSequentially(nextChildren, index, nextChildren.callback)
                        }else{
                            eventEmitter.emit("complete");//No parent with sequential-independent execution found. Tree is finish
                        }
                    }
                }

                executeSequentially(currentflow, 0,currentflow.callback);
            }else if(currentflow.execution === "sequential-independent") {
                var myCallback = function(err,index) {
                    if(err){
                        executeSequentially(currentflow, index+1,myCallback)
                    }
                }
                currentflow.callback = myCallback
                executeSequentially(currentflow, 0,currentflow.callback);
            }else{
                myError = new Error("Execution ["+currentflow.execution+"] is not a valid one")
                myError.name = "NotValidExecutionTypeError"
                launchFatal(myError,currentflow)
            }
        }else{
            myError = new Error("Execution type not found in flow")
            myError.name = "NotFoundExecutionTypeError"
            launchFatal(myError,currentflow)
        }
    }

    function executeSequentially(currentflow, index, callback) {
        var childrenList = currentflow.tasks
        currentflow.status = index
        if(childrenList && index < childrenList.length  ) {
            var node = childrenList[index];
                node.action = node.name;
                
            var errorFunction = function(err){
                if(!node.alreadyCalled && !stopped){
                    node.alreadyCalled = true;
                    eventEmitter.emit("error",err,node)
                    callback(err,index)
                }else if(!stopped){
                    var myError = new Error("Action ["+node.name+"] already called");
                    myError.name = "AlreadyCalledActionError"
                    throw (myError)
                }
            }

            var nextFunction = function(){
                if(!node.alreadyCalled && !stopped){
                    node.alreadyCalled = true;
                    index += 1
                    executeSequentially(currentflow, index, callback)
                }else if(!stopped){
                    var myError = new Error("Action ["+node.name+"] already called");
                    myError.name = "AlreadyCalledActionError"
                    throw (myError)
                }
            }

            if(node.tasks && node.tasks.length > 0){
                nextFunction = function(){
                    node.parent = currentflow
                    walk(node)
                }
            }

            if(eventEmitter.listeners(node.action).length > 0){
                eventEmitter.emit(node.action, { error: errorFunction, next: nextFunction, ctx: emmiterCtx}, node)
            }else{
                var myError = new Error("Listener for action ["+node.action+"] not found")
                myError.name = "ListenerNotFoundError"

                launchFatal(myError,node)
            }

        } else {
            if(currentflow.parent){//Current flow is a sub flow of the principal. So we now continue the parent flow
                index = currentflow.parent.status +1
                executeSequentially(currentflow.parent, index, currentflow.parent.callback)
            }else{//Tree is finish
                eventEmitter.emit("complete");
            }
        }
    }

    function checkParentCalling(currentflow){
        if(currentflow.parent){
            if(currentflow.parent.execution === "sequential-independent"){
                return currentflow.parent
            }else{
                return checkParentCalling(currentflow.parent);
            }
        }else{
            return null
        }
    }

    function launchFatal(err, node){
        if(eventEmitter.listeners("fatal").length > 0){
            eventEmitter.emit("fatal", err, node)
        }else{
            throw err
        }
    }
}

module.exports = TreeFlow;