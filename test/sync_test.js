const SyncQueue = require('../SyncQueue'),
    {expect} = require('chai'),
    Q = require('q')

describe('SyncFunction', function(){
    describe('function', function(){

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