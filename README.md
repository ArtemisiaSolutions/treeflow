#TREEFLOW

Treeflow is a Node.JS module to emit event in order to manage sequential or semi-sequential function.

##USAGE

All sequences are defined in a tree object like :

    var sequentialFlow = {
        name:"Sequential Flow",
        tasks:[
            {
                name:"action1",
                tasks:[
                    {
                        name:"subaction11",
                        tasks:[
                            {
                                name:"subsubaction1"
                            }
                        ]
                    },
                    {
                        name:"subaction12"
                    }
                ]
            },
            {
                name:"action2"
            },
            {
                name:"action3"
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
Treeflow will emit event for each actions in the configuration object (in example : `sequentialFlow`). All event are emitted sequentially. But if you have several tasks in tasks array, if one of task present in this array fails, the next one will be launched.

See unit test for more details.

####Object details

**Treeflow object :**

*Arguments :*

*   flowDefinition : Javascript object representig the tree of actions

*Methods :*

*   on(eventName, callback) : Listener of event `eventName`. When event is emitted, `callback`is called
*   run(ctx) : Launch the flow with a context variable (optional)`
*   stop() : Stop the flow ans emit `stop` event

*Events :*

*   complete : Event emits when tree is finish. Emitted even if a `flow.error()` is called
*   error(error,node) : Event emits when a `flow.error()` is called
*   fatal(error,node) : Event emits when there is an error in the flow definition.
*   stop : Event emits when `treeflow.stop()` is called

**Flow object (argument of each listener) :**

*Method :*

*   next() : Launch the next event
*   error() : Flow will continue if a sequential-independent flow is defined

*Attributes :*

*   ctx : Contains context passed in run arguments

####Sequential

In exemple, action1, subaction11 and subsubaction1 are sequential, if one on them fails, the other will not be called.

####Sequential-independent

In exemple action1, action2 and action3 are independant, if one of them fails, the other one will be called. It's the same thing for subaction11 and subaction12.