const Q = require ('@halleyassist/q-lite')

const NextTickPromise = Q()

function ThroatQueueFunction(n = 5){
    const running = []
    const ret = async function(what){
        if(what === null){
            if(running.length === 0) return running
            await Promise.all(running)
            return running
        }

        // This shouldn't happen if we correctly await on the throat
        while(running.length >= n){
            await Q.safeRace(running)
        }

        // call fn
        const rFn = async ()=>{
            await NextTickPromise
            try {
                if(typeof what === 'function'){
                    what = what()  
                }
                return await what
            } finally {
                for(let i = 0 ; i < running.length; i++){
                    if(running[i].id === idObj){
                        running.splice(i, 1)
                        break
                    }
                }
            }
        }

        const idObj = {}
        const r = rFn()
        r.id = idObj
        r.fn = what
        running.push(r)
        await r

        while(running.length >= n){
            await Q.safeRace(running)
        }
    }

    ret.running = running

    return ret
}

module.exports = ThroatQueueFunction