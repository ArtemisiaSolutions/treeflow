var should = require("should")
var TreeFlow = require("../lib/treeflow.js")
var util = require("util")

describe("While running TreeFlow", function() {

    it("with a simple sequential flow", function(done) {

        var sequentialFlow = {
            name:"Sequential Flow",
            execution: "sequential-independant",
            children:[
                {
                    name:"Action 1",
                    action:"action1",
                    execution: "sequential-independant",
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

        var treeFlow = new TreeFlow(sequentialFlow)


        /*
         treeFlow.on("error", function(err) {
         throw err
         })
         */

        treeFlow.on("action1", function(flow,action) {
            console.log("running ["+action.name+"]")
            console.log("flowData ["+util.inspect(flow.ctx.myData)+"]")
            flow.next()

        })

        treeFlow.on("action2", function(flow,action) {

            console.log("running ["+action.name+"]")
            flow.error(new Error("MyError"))
            flow.next()

        })

        treeFlow.on("action3", function(flow,action) {

            console.log("running ["+action.name+"]")

            flow.next()

        })
        treeFlow.on("subaction11", function(flow,action) {

            console.log("running ["+action.name+"]")
            //flow.error(new Error("MyError"))
            flow.next()

        })

        treeFlow.on("subaction12", function(flow,action) {

            console.log("running ["+action.name+"]")

            flow.next()

        })

        treeFlow.on("subsubaction1", function(flow,action) {

            console.log("running ["+action.name+"]")
            flow.error(new Error("MyError"))
            //flow.next()

        })

        treeFlow.on("error",function(err,action){
            console.log("error ["+err.message+"] event emit by action ["+action.name+"]")
        })

        treeFlow.run({myData:"coucou"})
    })

})
