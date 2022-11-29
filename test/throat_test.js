const {ThroatFunction, ThroatQueueFunction} = require('../index'),
     {expect} = require('chai'),
      Q = require('@halleyassist/q-lite')

describe('ThroatFunction', function(){
    it('should run 5 at a time with backpressure', async() => {
        const tf = ThroatFunction(5)

        const deferred = Q.defer()
        async function bg(){            
            for(let i = 0; i < 10; i++){
                await tf(()=>{
                    count++
                    return deferred.promise
                })
            }
        }

        let count = 0
        bg()

        await Q.delay(10)


        expect(count).to.be.eql(5)
        deferred.resolve()

        await Q.delay(10)
        await tf(null)
        expect(count).to.be.eql(10)
    })
    it('should run 5 at a time without backpressure', async() => {
        const tf = ThroatFunction(5)

        let count = 0
        const deferred = Q.defer()
        for(let i = 0; i < 10; i++){
            tf(()=>{
                count++
                return deferred.promise
            })
        }

        await Q.delay(10)


        expect(count).to.be.eql(5)
        deferred.resolve()

        
        await Q.delay(10)
        await tf(null)
        expect(count).to.be.eql(10)

    })
})
describe('ThroatQueueFunction', function(){
    it('should run 5 at a time without backpressure', async() => {
        const tf = ThroatQueueFunction(5)

        let count = 0
        const deferred = Q.defer()
        for(let i = 0; i < 10; i++){
            tf(()=>{
                count++
                return deferred.promise
            })
        }

        await Q.delay(10)


        expect(count).to.be.eql(5)
        deferred.resolve()

        
        await Q.delay(10)
        await tf(null)
        expect(count).to.be.eql(10)

    })
    it('should run 5 times only if cancelled from fn', async() => {
        const tf = ThroatQueueFunction(5)

        let count = 0
        const deferred = Q.defer()
        const p = []
        for(let i = 0; i < 10; i++){
            p.push(tf(()=>{
                count++
                return deferred.promise
            }))
        }

        await Q.delay(10)


        expect(count).to.be.eql(5)
        
        for(const pp of p){
            pp.cancel()
        }

        deferred.resolve(true)

        await tf(null)
        expect(count).to.be.eql(5)

    })
    it('should run 5 times only if cancelled from running', async() => {
        const tf = ThroatQueueFunction(5)

        let count = 0
        const deferred = Q.defer()
        const p = []
        for(let i = 0; i < 10; i++){
            p.push(tf(Q.canceller(async(cancellationState)=>{
                await cancellationState.promiseWrap(deferred.promise)
                count++
            })))
        }

        await Q.delay(10)


        expect(tf.running.length).to.be.eql(5)
        
        for(const pp of tf.running){
            pp.cancel()
        }

        deferred.resolve(true)


        expect(tf.running.length).to.be.eql(5)

        await tf(null)
        expect(count).to.be.eql(5)

    })
    it('should capture stack trace', async() => {
        async function testFn(){
            const errors = []
            const tf = ThroatQueueFunction(5)

            for(let i = 0; i < 10; i++){
                try {
                    await tf(()=>{
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