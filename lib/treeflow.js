var events = require('events')
var util = require('util')

var emmiterCtx = null

function TreeFlow(flowDefinition) {
    var eventEmitter = new events.EventEmitter()
    var self = this

    self.run = function(ctx){
        emmiterCtx=ctx
        if(flowDefinition){
            if(flowDefinition.children && flowDefinition.children.length > 0){
                walk(flowDefinition,eventEmitter)
            }else{
                var err = new Error("No children found in main flow")
                err.name = "NotFoundChildrenError"
                launchFatal(eventEmitter,err,flowDefinition)
            }
        }else{
            var err = new Error("No configuration object found")
            err.name = "NotFoundConfigurationObjectError"
            launchFatal(eventEmitter,err,flowDefinition)
        }
    }

    self.on = function(eventName, callback){
        eventEmitter.on(eventName,callback)
    }
}

function walk(currentflow,eventEmitter) {
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
                        executeSequentially(nextChildren, index, eventEmitter, nextChildren.callback)
                    }else{
                        eventEmitter.emit("complete");//No parent with sequential-independant execution found. Tree is finish
                    }
                }
            }

            executeSequentially(currentflow, 0, eventEmitter,currentflow.callback);
        }else if(currentflow.execution === "sequential-independant") {
            var myCallback = function(err,index) {
                if(err){
                    executeSequentially(currentflow, index+1, eventEmitter,myCallback)
                }
            }
            currentflow.callback = myCallback
            executeSequentially(currentflow, 0, eventEmitter,currentflow.callback);
        }else{
            var myError = new Error("Execution ["+currentflow.execution+"] is not a valid one")
            myError.name = "NotValidExecutionTypeError"
            launchFatal(eventEmitter,myError,currentflow)
        }
    }else{
        var myError = new Error("Execution type not found in flow")
        myError.name = "NotFoundExecutionTypeError"
        launchFatal(eventEmitter,myError,currentflow)
    }
}

function executeSequentially(currentflow, index, eventEmitter, callback) {
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
                executeSequentially(currentflow, index, eventEmitter, callback)
            }else{
                var myError = new Error("Action ["+node.name+"] already called");
                myError.name = "AlreadyCalledActionError"
                throw (myError)
            }
        }

        if(node.children && node.children.length > 0){
            nextFunction = function(){
                node.parent = currentflow
                walk(node,eventEmitter)
            }
        }

        if(eventEmitter.listeners(node.action).length > 0){
            eventEmitter.emit(node.action, { error: errorFunction, next: nextFunction, ctx: emmiterCtx}, node)
        }else{
            var myError = new Error("Listener for action ["+node.action+"] not found")
            myError.name = "ListenerNotFoundError"

            launchFatal(eventEmitter,myError,node)
        }

    } else {
        if(currentflow.parent){//Current flow is a sub flow of the principal. So we now continue the parent flow
            index = currentflow.parent.status +1
            executeSequentially(currentflow.parent, index, eventEmitter, currentflow.parent.callback)
        }else{//Tree is finish
            eventEmitter.emit("complete");
        }
    }
}

function checkParentCalling(currentflow){
    if(currentflow.parent){
        if(currentflow.parent.execution === "sequential-independant"){
            return currentflow.parent
        }else{
            return checkParentCalling(currentflow.parent);
        }
    }else{
        return null
    }
}

function launchFatal(eventEmitter, err, node){
    eventEmitter.emit("fatal", err, node)
}

module.exports = TreeFlow;