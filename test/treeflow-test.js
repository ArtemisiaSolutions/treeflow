var should = require("should")
var TreeFlow = require("../lib/treeflow.js")
var util = require("util")


describe("Treeflow",function(){
    describe("Error in configuration object :",function(){
        describe("\n\tChildren not found in main flow",function(){
            it("should emmit fatal event with NotFoundChildrenError type",function(done){
                var treeFlow = new TreeFlow({name:"No children flow",execution: "sequential",children:""})

                treeFlow.on("fatal",function(err,node){
                    err.name.should.equal("NotFoundTasksError");
                    done()
                })

                treeFlow.on("complete",function(){
                    done(new Error("Event complete should not be emit"))
                })

                treeFlow.run({ctx:"test"})
            })
        })
        describe("\n\tNo giving config file arguments",function(){
            it("should emmit fatal event with NotFoundConfigurationObjectError type",function(done){
                var treeFlow = new TreeFlow()

                treeFlow.on("fatal",function(err,node){
                    err.name.should.equal("NotFoundConfigurationObjectError");
                    done()
                })

                treeFlow.on("complete",function(){
                    done(new Error("Event complete should not be emit"))
                })

                treeFlow.run({ctx:"test"})
            })
        })
    })

    describe("Sequential flow",function(){
        describe("Only flow.next() called",function(){
            it("should run all actions",function(done){

                var treeFlow = new TreeFlow(getSequentialConfig())
                var actionCalled = []
                var errorCalled = false
                var completeCalled = false
                var fatalCalled = false

                treeFlow.on("action1", function(flow,action) {
                    console.log("running ["+action.name+"]")
                    actionCalled.push(action.action)
                    flow.next()
                })

                treeFlow.on("subaction11", function(flow,action) {
                    console.log("running ["+action.name+"]")
                    actionCalled.push(action.action)
                    flow.next()
                })
                
                treeFlow.on("subsusubbaction1", function(flow,action) {
                    console.log("running ["+action.name+"]")
                    actionCalled.push(action.action)
                    flow.next()
                })

                treeFlow.on("subsubaction1", function(flow,action) {
                    console.log("running ["+action.name+"]")
                    actionCalled.push(action.action)
                    flow.next()
                })

                treeFlow.on("error",function(err,action){
                    if(err.message){
                        console.log("error ["+err.message+"] event emit by action ["+action.name+"]")
                    }
                    errorCalled = true
                })

                treeFlow.on("complete",function(){
                    console.log("tree is complete")
                    completeCalled = true

                    actionCalled.should.include("action1")
                    actionCalled.should.include("subaction11")
                    actionCalled.should.include("subsusubbaction1")
                    actionCalled.should.include("subsubaction1")
                    actionCalled.should.have.length(4)
                    should.strictEqual(false, fatalCalled)
                    should.strictEqual(false, errorCalled)
                    should.strictEqual(true, completeCalled)

                    done()
                })

                treeFlow.on("fatal",function(err,node){
                    console.log("fatal error detected")
                    fatalCalled = true
                    done(err)
                })

                treeFlow.run({myData:"coucou"})

            })
        })
        describe("flow.error() called",function(){
            it("should run actions until an error occured",function(done){

                var treeFlow = new TreeFlow(getSequentialConfig())

                var actionCalled = []
                var errorCalled = false
                var completeCalled = false
                var fatalCalled = false

                treeFlow.on("action1", function(flow,action) {
                    console.log("running ["+action.name+"]")
                    actionCalled.push(action.action)
                    flow.next()
                })
                
                treeFlow.on("subaction11", function(flow,action) {
                    console.log("running ["+action.name+"]")
                    actionCalled.push(action.action)
                    flow.next()
                })


                treeFlow.on("subsubaction1", function(flow,action) {
                    console.log("running ["+action.name+"]")
                    actionCalled.push(action.action)
                    flow.error("MyError")
                })
                
                treeFlow.on("subsusubbaction1", function(flow,action) {
                    console.log("running ["+action.name+"]")
                    actionCalled.push(action.action)
                    flow.next()
                })

                treeFlow.on("error",function(err,action){
                    if(err.message){
                        console.log("error ["+err.message+"] event emit by action ["+action.name+"]")
                    }
                    errorCalled = true
                })

                treeFlow.on("complete",function(){
                    console.log("tree is complete")
                    completeCalled = true

                    actionCalled.should.include("action1")
                    actionCalled.should.include("subaction11")
                    actionCalled.should.include("subsubaction1")
                    actionCalled.should.not.include("subsubsubaction1")
                    actionCalled.should.have.length(3)
                    should.strictEqual(false, fatalCalled)
                    should.strictEqual(true, errorCalled)
                    should.strictEqual(true, completeCalled)

                    done()
                })

                treeFlow.on("fatal",function(err,node){
                    console.log("fatal error detected"+err)
                    fatalCalled = true
                    done(err)
                })

                treeFlow.run({myData:"coucou"})

            })
        })
        describe("Stop flow",function(){
            it("should stop tree run",function(done){
                var treeFlow = new TreeFlow(getSequentialConfig())

                var actionCalled = []
                var errorCalled = false
                var completeCalled = false
                var fatalCalled = false
                var stopCalled = false

                treeFlow.on("action1", function(flow,action) {
                    console.log("running ["+action.name+"]")
                    actionCalled.push(action.action)
                    flow.next()
                })

                treeFlow.on("subaction11", function(flow,action) {
                    console.log("running ["+action.name+"]")
                    actionCalled.push(action.action)
                    treeFlow.stop();
                    flow.next()
                })

                treeFlow.on("subsubaction1", function(flow,action) {
                    console.log("running ["+action.name+"]")
                    actionCalled.push(action.action)
                    flow.next()
                })
                
                treeFlow.on("subsusubbaction1", function(flow,action) {
                    console.log("running ["+action.name+"]")
                    actionCalled.push(action.action)
                    flow.next()
                })

                treeFlow.on("error",function(err,action){
                    if(err.message){
                        console.log("error ["+err.message+"] event emit by action ["+action.name+"]")
                    }
                    errorCalled = true
                })

                treeFlow.on("complete",function(){
                    console.log("should not be complete")
                    completeCalled = true
                    done(new Error("Should not be complte"))
                })

                treeFlow.on("fatal",function(err,node){
                    console.log("fatal error detected"+err)
                    fatalCalled = true
                    done(err)
                })
                treeFlow.on("stop",function(){
                    console.log("treeflow stopped")
                    stopCalled = true
                    done()
                })

                treeFlow.run({myData:"coucou"})
            })
        })
    })

    describe("Sequential independent",function(){
        describe("Only flow.next() called",function(){
            it("should run all activities",function(done){
                var treeFlow = new TreeFlow(getSequentialIndependentConfig())
                var actionCalled = []
                var errorCalled = false
                var completeCalled = false
                var fatalCalled = false

                treeFlow.on("action1", function(flow,action) {
                    console.log("running ["+action.name+"]")
                    actionCalled.push(action.action)
                    flow.next()
                })

                treeFlow.on("action2", function(flow,action) {
                    console.log("running ["+action.name+"]")
                    actionCalled.push(action.action)
                    flow.next()
                })

                treeFlow.on("action3", function(flow,action) {
                    console.log("running ["+action.name+"]")
                    actionCalled.push(action.action)
                    flow.next()
                })

                treeFlow.on("subaction11", function(flow,action) {
                    console.log("running ["+action.name+"]")
                    actionCalled.push(action.action)
                    flow.next()
                })

                treeFlow.on("subaction12", function(flow,action) {
                    actionCalled.push(action.action)
                    flow.next()
                })

                treeFlow.on("subsubaction1", function(flow,action) {
                    console.log("running ["+action.name+"]")
                    actionCalled.push(action.action)
                    flow.next()
                })
                
                treeFlow.on("subsubaction2", function(flow,action) {
                    console.log("running ["+action.name+"]")
                    actionCalled.push(action.action)
                    flow.next()
                })

                treeFlow.on("error",function(err,action){
                    if(err.message){
                        console.log("error ["+err.message+"] event emit by action ["+action.name+"]")
                    }
                    errorCalled = true
                })

                treeFlow.on("complete",function(){
                    console.log("tree is complete")
                    completeCalled = true

                    actionCalled.should.include("action1")
                    actionCalled.should.include("action2")
                    actionCalled.should.include("action3")
                    actionCalled.should.include("subaction11")
                    actionCalled.should.include("subaction12")
                    actionCalled.should.include("subsubaction1")
                    actionCalled.should.include("subsubaction2")
                    actionCalled.should.have.length(7)
                    should.strictEqual(false, fatalCalled)
                    should.strictEqual(false, errorCalled)
                    should.strictEqual(true, completeCalled)

                    done()
                })

                treeFlow.on("fatal",function(err,node){
                    console.log("fatal error detected")
                    fatalCalled = true
                    done(err)
                })

                treeFlow.run({myData:"coucou"})
            })
        })

        describe("flow.error() called",function(){
            describe("on a leaf node",function(){
                it("should run all actions",function(done){
                    var treeFlow = new TreeFlow(getSequentialIndependentConfig())

                    var actionCalled = []
                    var errorCalled = false
                    var completeCalled = false
                    var fatalCalled = false

                    treeFlow.on("action1", function(flow,action) {
                        console.log("running ["+action.name+"]")
                        actionCalled.push(action.action)
                        flow.next()
                    })

                    treeFlow.on("action2", function(flow,action) {
                        console.log("running ["+action.name+"]")
                        actionCalled.push(action.action)
                        flow.next()
                    })

                    treeFlow.on("action3", function(flow,action) {
                        console.log("running ["+action.name+"]")
                        actionCalled.push(action.action)
                        flow.error(new Error("MyError"))
                    })

                    treeFlow.on("subaction11", function(flow,action) {
                        console.log("running ["+action.name+"]")
                        actionCalled.push(action.action)
                        flow.next()
                    })

                    treeFlow.on("subaction12", function(flow,action) {
                        actionCalled.push(action.action)
                        flow.next()
                    })

                    treeFlow.on("subsubaction1", function(flow,action) {
                        console.log("running ["+action.name+"]")
                        actionCalled.push(action.action)
                        flow.error(new Error("MyError"))
                    })
                    treeFlow.on("subsubaction2", function(flow,action) {
                        console.log("running ["+action.name+"]")
                        actionCalled.push(action.action)
                        flow.next()
                    })

                    treeFlow.on("error",function(err,action){
                        if(err.message){
                            console.log("error ["+err.message+"] event emit by action ["+action.name+"]")
                        }
                        errorCalled = true
                    })

                    treeFlow.on("complete",function(){
                        console.log("tree is complete")
                        completeCalled = true

                        actionCalled.should.include("action1")
                        actionCalled.should.include("action2")
                        actionCalled.should.include("action3")
                        actionCalled.should.include("subaction11")
                        actionCalled.should.include("subaction12")
                        actionCalled.should.include("subsubaction1")
                        actionCalled.should.include("subsubaction2")
                        
                        actionCalled.should.have.length(7)
                        should.strictEqual(false, fatalCalled)
                        should.strictEqual(true, errorCalled)
                        should.strictEqual(true, completeCalled)

                        done()
                    })

                    treeFlow.on("fatal",function(err,node){
                        console.log("fatal error detected"+err)
                        fatalCalled = true
                        done(err)
                    })

                    treeFlow.run({myData:"coucou"})
                })
            })

            describe("on node with children",function(){
                it("should run node at same level, but not its children",function(done){
                    var treeFlow = new TreeFlow(getSequentialIndependentConfig())

                    var actionCalled = []
                    var errorCalled = false
                    var completeCalled = false
                    var fatalCalled = false

                    treeFlow.on("action1", function(flow,action) {
                        console.log("running ["+action.name+"]")
                        actionCalled.push(action.action)
                        flow.next()
                    })

                    treeFlow.on("action2", function(flow,action) {
                        console.log("running ["+action.name+"]")
                        actionCalled.push(action.action)
                        flow.next()
                    })

                    treeFlow.on("action3", function(flow,action) {
                        console.log("running ["+action.name+"]")
                        actionCalled.push(action.action)
                        flow.next()
                    })

                    treeFlow.on("subaction11", function(flow,action) {
                        console.log("running ["+action.name+"]")
                        actionCalled.push(action.action)
                        flow.error(new Error("MyError"))
                    })

                    treeFlow.on("subaction12", function(flow,action) {
                        actionCalled.push(action.action)
                        flow.next()
                    })

                    treeFlow.on("subsubaction1", function(flow,action) {
                        console.log("running ["+action.name+"]")
                        actionCalled.push(action.action)
                        flow.next()
                    })

                    treeFlow.on("error",function(err,action){
                        if(err.message){
                            console.log("error ["+err.message+"] event emit by action ["+action.name+"]")
                        }
                        errorCalled = true
                    })

                    treeFlow.on("complete",function(){
                        console.log("tree is complete")
                        completeCalled = true

                        actionCalled.should.include("action1")
                        actionCalled.should.include("action2")
                        actionCalled.should.include("action3")
                        actionCalled.should.include("subaction11")
                        actionCalled.should.include("subaction12")
                        actionCalled.should.not.include("subsubaction1")
                        actionCalled.should.have.length(5)
                        should.strictEqual(false, fatalCalled)
                        should.strictEqual(true, errorCalled)
                        should.strictEqual(true, completeCalled)

                        done()
                    })

                    treeFlow.on("fatal",function(err,node){
                        console.log("fatal error detected"+err)
                        fatalCalled = true
                        done(err)
                    })

                    treeFlow.run({myData:"coucou"})
                })
            })
        })
    })

    describe("Sequential mixte",function(){
        describe("Only flow.next()",function(){

        })
    })
})

function getSequentialConfig(){
    return {
        name:"Sequential Flow",
        tasks:[
            {
                name:"action1",
                tasks:[
                    {
                        name:"subaction11",
                        tasks:[
                            {
                                name:"subsubaction1",
                                tasks:[
                                {
                                    name:"subsusubbaction1"
                                }
                                ]
                            }
                        ]
                    }
                ]
            }
        ]
    }
}

function getSequentialIndependentConfig(){
    return {
        name:"Sequential Independent Flow",
        tasks:[
            {
                name:"action1",
                tasks:[
                    {
                        name:"subaction11",
                        tasks:[
                            {
                                name:"subsubaction1"
                            },
                             {
                                name:"subsubaction2"
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
}