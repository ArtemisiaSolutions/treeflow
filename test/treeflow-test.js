var should = require("should")
var TreeFlow = require("../lib/treeflow.js")


describe("While running TreeFlow", function() {

    it("with a simple sequential flow", function(done) {

        var sequentialFlow = {
            name:"Sequential Flow",
            children:{
                execution: "sequential-independant",
                list: [
                {
                    name:"Action 1",
                    action:"action1",
                    data: "FOOBAR",
                    children: {
                        execution: "sequential-independant",
                        list: [
                        {
                            name:"Sub-Action 1 - 1",
                            action:"subaction11",
                            children: {
                                execution: "sequential",
                                list: [
                                    {
                                        name:"Sub-Sub-Action 1",
                                        action:"subsubaction1"
                                    }
                                    ]
                            }
                        },
                        {
                            name:"Sub-Action 1 - 2",
                            action:"subaction12"
                        }
                        ]
                    }
                }, {
                    name:"Action 2",
                    action:"action2"
                }, {
                    name:"Action 3",
                    action:"action3"
                }
                ]
            }
        }

        var treeFlow = new TreeFlow(sequentialFlow)


        /*
        treeFlow.on("error", function(err) {
            throw err
        })
        */

        treeFlow.on("action1", function(action, flow) {
            console.log("running ["+action.name+"]")

            flow.next()

        })

        treeFlow.on("action2", function(action, flow) {

            console.log("running ["+action.name+"]")
            flow.error(new Error("MyError"))
            //flow.next()

        })

        treeFlow.on("action3", function(action, flow) {

            console.log("running ["+action.name+"]")

            flow.next()

        })
        treeFlow.on("subaction11", function(action, flow) {

            console.log("running ["+action.name+"]")

            flow.next()

        })

        treeFlow.on("subaction12", function(action, flow) {

            console.log("running ["+action.name+"]")

            flow.next()

        })

        treeFlow.on("subsubaction1", function(action, flow) {

            console.log("running ["+action.name+"]")
            flow.error(new Error("MyError"))
            //flow.next()

        })

        treeFlow.run()
    })

})
