const ThroatFunction = require('../ThroatFunction'),
     {expect} = require('chai'),
      Q = require('q')

describe('ThroatFunction', function(){
    it('should run 5 at a time with backpressure', async() => {
        const tf = ThroatFunction(5)

        async function bg(){            
            for(let i = 0; i < 10; i++){
                await tf(()=>{
                    count++
                    return deferred.promise
                })
            }
        }

        let count = 0
        const deferred = Q.defer()
        bg()

        await Q.delay(10)


        expect(count).to.be.eql(5)
        deferred.resolve()
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
    })
})