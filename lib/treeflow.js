var winston = require('winston')
var events = require('events')
var util = require('util');


var EVENT = {
    action: "action",
        ERROR: "error",
        COMPLETE: "complete"
}

function TreeFlow(flowDefinition, actions) {

    var eventEmitter = new events.EventEmitter()
    var self = this

    winston.info("Loading Flow ["+flowDefinition.name+"] definition")

    self.run = function(){
        winston.info("Running flow ["+flowDefinition.name+"]")
        if(flowDefinition.children){
            walk(flowDefinition.children,eventEmitter)
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

function walk(children,eventEmitter) {
    children.stop = function(){
        return checkParentCalling(children);
    }

    if(children.execution === "sequential") {
        var callback = function(err) {
            if(err){
                winston.debug("Error on sequential children")
                winston.error(err)
                var nextChildren = children.stop()
                if(nextChildren){
                    var index = nextChildren.status +1
                    executeSequentially(nextChildren, index, eventEmitter, nextChildren.callback)
                }
            }
        }
        children.callback = callback;

        executeSequentially(children, 0, eventEmitter,children.callback);
    }

    if(children.execution === "sequential-independant") {

        var callback = function(err,index) {
            if(err){
                winston.debug("Error on sequential-idependant children")
                executeSequentially(children, index+1, eventEmitter,callback)
            }
        }
        children.callback = callback;
        executeSequentially(children, 0, eventEmitter,children.callback);
    }

}

function executeSequentially(children, index, eventEmitter, callback) {
    var childrenList = children.list
    children.status = index
    if(childrenList && index < childrenList.length  ) {
        winston.debug("executeSequentially start whith children N° ["+(index+1)+"] / [ "+childrenList.length+" ]")
        var node = childrenList[index];

        var errorFunction = function(err){
            callback(err,index)
        }

        var nextFunction = function(){
            index += 1
            executeSequentially(children, index, eventEmitter, callback)
        }

        if(node.children && node.children.list.length > 0){
            nextFunction = function(){
                node.children.parent = children
                walk(node.children,eventEmitter)
            }
        }

        eventEmitter.emit(node.action, node, { error: errorFunction, next: nextFunction})

    } else {
        //winston.debug(util.inspect(children))
        if(children.parent){
            index = children.parent.status +1
            executeSequentially(children.parent, index, eventEmitter, children.parent.callback)
        }else{
            winston.debug("Tree is finish")
        }
    }
}

function checkParentCalling(children){
    if(children.parent){
        if(children.parent.execution === "sequential-independant"){
            winston.debug("Parent children with sequential-independant found [ "+children.parent.list[0].name+" ]")
            return children.parent
        }else{
            winston.debug("Parent children with sequential-independant not found try next")
            return checkParentCalling(children.parent);
        }
    }else{
        return null
    }
}
module.exports = TreeFlow;