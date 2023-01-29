const {SyncFunction, SyncQueue} = require('../index'),
     {expect} = require('chai'),
      Q = require('@halleyassist/q-lite')

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
        it('should capture stack trace', async() => {
            async function testFn(){
                const errors = []
                const sf = SyncFunction()
    
                for(let i = 0; i < 10; i++){
                    try {
                        await sf(()=>{
                            throw new Error('test')
                        })
                    } catch(ex) {
                        errors.push(ex)
                    }
                }
    
                return errors
            }
    
            const errors = await testFn()
            expect(errors.length).to.be.eql(10)
            for(const e of errors){
                expect(e.stack).to.be.a('string')
                expect(e.stack).to.contain('testFn')
            }
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
        it('should capture stack trace', async() => {
            async function testFn(){
                const errors = []
                const sf = SyncQueue()
    
                for(let i = 0; i < 10; i++){
                    try {
                        await sf(()=>{
                            throw new Error('test')
                        })
                    } catch(ex) {
                        errors.push(ex)
                    }
                }
    
                return errors
            }
    
            const errors = await testFn()
            expect(errors.length).to.be.eql(10)
            for(const e of errors){
                expect(e.stack).to.be.a('string')
                expect(e.stack).to.contain('testFn')
            }
        })
    })
})