var winston = require('winston')
var events = require('events')
var util = require('util');

var EVENT = {
    action: "action",
    ERROR: "error",
    COMPLETE: "complete"
}

var emmiterCtx = null

function TreeFlow(flowDefinition) {

    var eventEmitter = new events.EventEmitter()
    var self = this

    winston.info("Loading Flow ["+flowDefinition.name+"] definition")

    self.run = function(ctx){
        emmiterCtx=ctx
        winston.info("Running flow ["+flowDefinition.name+"]")
        if(flowDefinition){
            walk(flowDefinition,eventEmitter)
        }else{
            //TODO manage error
            var err = new Error("No children found")
            winston.error(err)
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

    if(currentflow.execution === "sequential") {
        currentflow.callback = function(err) {
            if(err){
                winston.debug("Error on sequential children")
                winston.error(err)
                var nextChildren = currentflow.stop()
                if(nextChildren){
                    var index = nextChildren.status +1
                    executeSequentially(nextChildren, index, eventEmitter, nextChildren.callback)
                }
            }
        }

        executeSequentially(currentflow, 0, eventEmitter,currentflow.callback);
    }

    if(currentflow.execution === "sequential-independant") {
        var myCallback = function(err,index) {
            if(err){
                winston.debug("Error on sequential-idependant children")
                executeSequentially(currentflow, index+1, eventEmitter,myCallback)
            }
        }
        currentflow.callback = myCallback
        executeSequentially(currentflow, 0, eventEmitter,currentflow.callback);
    }

}

function executeSequentially(currentflow, index, eventEmitter, callback) {
    var childrenList = currentflow.children
    currentflow.status = index
    if(childrenList && index < childrenList.length  ) {
        winston.debug("executeSequentially start whith children N° ["+(index+1)+"] / [ "+childrenList.length+" ]")
        var node = childrenList[index];

        var errorFunction = function(err){
            winston.error("Error "+err.message)
            if(!node.alreadyCalled){
                node.alreadyCalled = true;
                eventEmitter.emit("error",err,node)
                callback(err,index)
            }else{
                var myError = new Error("Action ["+node.name+"] already called");
                winston.error(myError)
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
                winston.error(myError)
                throw (myError)
            }
        }

        if(node.children && node.children.length > 0){
            nextFunction = function(){
                node.parent = currentflow
                walk(node,eventEmitter)
            }
        }

        eventEmitter.emit(node.action, { error: errorFunction, next: nextFunction, ctx: emmiterCtx}, node)

    } else {
        //winston.debug(util.inspect(children))
        if(currentflow.parent){
            index = currentflow.parent.status +1
            executeSequentially(currentflow.parent, index, eventEmitter, currentflow.parent.callback)
        }else{
            winston.debug("Tree is finish")
            eventEmitter.emit("complete");
        }
    }
}

function checkParentCalling(currentflow){
    if(currentflow.parent){
        if(currentflow.parent.execution === "sequential-independant"){
            winston.debug("Parent children with sequential-independant found [ "+currentflow.parent.children[0].name+" ]")
            return currentflow.parent
        }else{
            winston.debug("Parent children with sequential-independant not found try next")
            return checkParentCalling(currentflow.parent);
        }
    }else{
        return null
    }
}
module.exports = TreeFlow;