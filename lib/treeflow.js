var events = require('events')
var util = require('util')
var ce = require('cloneextend')

var emmiterCtx = null


function TreeFlow(flowDefinition) {
    var eventEmitter = new events.EventEmitter()
    var self = this
    var currentFlowDefinition = ce.clone(flowDefinition)

    self.run = function(ctx){
        emmiterCtx=ctx
        if(currentFlowDefinition){
            if(currentFlowDefinition.children && currentFlowDefinition.children.length > 0){
                walk(currentFlowDefinition)
            }else{
                var err = new Error("No children found in main flow")
                err.name = "NotFoundChildrenError"
                launchFatal(err,currentFlowDefinition)
            }
        }else{
            var err = new Error("No configuration object found")
            err.name = "NotFoundConfigurationObjectError"
            launchFatal(err,currentFlowDefinition)
        }
    }

    self.on = function(eventName, callback){
        eventEmitter.on(eventName,callback)
    }

    function walk(currentflow) {
        currentflow.stop = function(){
            return checkParentCalling(currentflow);
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
                var myError = new Error("Execution ["+currentflow.execution+"] is not a valid one")
                myError.name = "NotValidExecutionTypeError"
                launchFatal(myError,currentflow)
            }
        }else{
            var myError = new Error("Execution type not found in flow")
            myError.name = "NotFoundExecutionTypeError"
            launchFatal(myError,currentflow)
        }
    }

    function executeSequentially(currentflow, index, callback) {
        var childrenList = currentflow.children
        currentflow.status = index
        if(childrenList && index < childrenList.length  ) {
            var node = childrenList[index];

            var errorFunction = function(err){
                if(!node.alreadyCalled){
                    node.alreadyCalled = true;
                    eventEmitter.emit("error",err,node)
                    callback(err,index)
                }else{
                    var myError = new Error("Action ["+node.name+"] already called");
                    myError.name = "AlreadyCalledActionError"
                    throw (myError)
                }
            }

            var nextFunction = function(){
                if(!node.alreadyCalled){
                    node.alreadyCalled = true;
                    index += 1
                    executeSequentially(currentflow, index, callback)
                }else{
                    var myError = new Error("Action ["+node.name+"] already called");
                    myError.name = "AlreadyCalledActionError"
                    throw (myError)
                }
            }

            if(node.children && node.children.length > 0){
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