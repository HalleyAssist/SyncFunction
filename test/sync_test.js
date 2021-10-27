const {SyncFunction, SyncQueue} = require('../index'),
     {expect} = require('chai'),
      Q = require('q-lite')

describe('SyncFunction', function(){
    describe('function', function(){

        it('should run all functions', async() => {
            const sq = SyncFunction()

            let count = 0
            const p = []
            p.push(sq(async()=>{
                count++
                return 0
            }))
            p.push(sq(async()=>{
                await Q.delay(100)
                if(count != 1) throw new Error('parallel execution?')
                count++
                return 1
            }))
            p.push(sq(async()=>{
                count++
                return 2
            }))

            expect(await p[2]).to.be.eql(2)
            expect(await p[1]).to.be.eql(1)
            expect(await p[0]).to.be.eql(0)
            expect(count).to.be.eql(3)
        })

        it('should log on timeout', async() => {
            const sq = SyncFunction()

            let timedOut = false
            SyncFunction.timeout = 80
            sq.debugLog = (e)=>{
                console.log(e)
                timedOut = true
                SyncFunction.timeout = 10000
            }

            let count = 0
            const p = []
            p.push(sq(async()=>{
                count++
                return 0
            }))
            p.push(sq(async()=>{
                await Q.delay(100)
                if(count != 1) throw new Error('parallel execution?')
                count++
                return 1
            }))
            p.push(sq(async()=>{
                count++
                return 2
            }))

            expect(await p[2]).to.be.eql(2)
            expect(await p[1]).to.be.eql(1)
            expect(await p[0]).to.be.eql(0)
            expect(count).to.be.eql(3)
            expect(timedOut).to.be.true
        })
    })
    describe('queue', function(){
        it('should run all functions', async() => {
            const sq = SyncQueue()

            let count = 0
            const p = []
            p.push(sq(async()=>{
                count++
                return 0
            }))
            p.push(sq(async()=>{
                await Q.delay(100)
                if(count != 1) throw new Error('parallel execution?')
                count++
                return 1
            }))
            p.push(sq(async()=>{
                count++
                return 2
            }))

            expect(await p[2]).to.be.eql(2)
            expect(await p[1]).to.be.eql(1)
            expect(await p[0]).to.be.eql(0)
            expect(count).to.be.eql(3)
        })
    })
})