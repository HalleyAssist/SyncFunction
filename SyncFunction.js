function SyncFunction(limit = 100){
    let sync = new Promise(r=>r(null))
    let count = 0
    const ret = async (fn) => {
        const oldSync = sync
        let resolve
        sync = new Promise((_resolve)=>resolve = _resolve)
        if(++count > limit){
            log(`SyncFunction backlog of ${count} over limit`)
        }
        await oldSync
        try {
            const ret = await fn()
            count --
            resolve()
            return ret
        }catch(ex){
            //Don't use finally, resolve deferred as soon as possible
            count --
            resolve()
            throw ex
        }
    }
    ret.awaiter = async() => {
        let currentSync
        do {
            currentSync = sync
            await currentSync
        } while(currentSync !== sync)
    }
    ret.toString = () => {
        return `[SyncFunction count:${count}/${limit}]`
    }
    return ret
}

module.exports = SyncFunction