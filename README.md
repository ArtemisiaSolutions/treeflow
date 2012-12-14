#TREEFLOW

Treeflow is a Node.JS module to emit event in order to manage sequential or semi-sequential function.

##USAGE

All sequences are defined in a tree object like :

    var sequentialFlow = {
        name:"Sequential Flow",
        execution: "sequential-independent",
        children:[
            {
                name:"Action 1",
                action:"action1",
                execution: "sequential",
                children:[
                    {
                        name:"Sub-Action 1 - 1",
                        action:"subaction11",
                        execution: "sequential",
                        children:[
                            {
                                name:"Sub-Sub-Action 1",
                                action:"subsubaction1"
                            }
                        ]
                    },
                    {
                        name:"Sub-Action 1 - 2",
                        action:"subaction12"
                    }
                ]
            },
            {
                name:"Action 2",
                action:"action2"
            },
            {
                name:"Action 3",
                action:"action3"
            }
        ]
    }

To init the flow :

    var treeFlow = new TreeFlow(sequentialFlow)

Next you need to declare listener :

    treeFlow.on("action1", function(flow, action) {
        console.log("running ["+action.name+"]")
        console.log("flowData ["+flow.data.myData+"]")
        flow.next()
    })

    treeFlow.on("action2", function(flow, action) {
        console.log("running ["+action.name+"]")
        flow.error(new Error("MyError"))
    })
    ...

To finish, run the flow :

    treeFlow.run({myCtx:"This is a context object"})

###General
Treeflow will emit event for each actions in the configuration object (in example : `sequentialFlow`). All event are emitted sequentially. But you can choose to continue the sequence or not if a event failed.
There are two types of execution :

*   Sequential
*   Sequential-independent

See unit test for more details.

####Object details

**Treeflow object :**

*Arguments :*

*   flowDefinition : Javascript object representig the tree of actions

*Methods :*

*   on(eventName, callback) : Listener of event `eventName`. When event is emitted, `callback`is called
*   run(ctx) : Launch the flow with a context variable (optional)

*Events :*

*   complete : Event emits when tree is finish. Emitted even if a `flow.error()` is called
*   error(error,node) : Event emits when a `flow.error()` is called
*   fatal(error,node) : Event emits when there is an error in the flow definition.

**Flow object (argument of each listener) :**

*Method :*

*   next() : Launch the next event
*   error() : Flow will continue if a sequential-independent flow is defined

*Attributes :*

*   ctx : Contains context passed in run arguments

####Sequential

If you choose this execution type, all children event will be emitted sequentially. If one of the children fails, event `complete` is fired and execution stop.
In the given example if action `subaction11` failed, its children are not called, and action `subaction12` neither.

####Sequential-independent

If you choose this execution type, all children event will be fired sequentially. If one children fails, next children of its level is called.
In the given example if action `subaction11` failed, its children are not called, and action `subaction12` neither but `action2` is called.