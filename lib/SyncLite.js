class SyncLite {
    static _execFn(s, fn){
        let pResolveStart
        const pStart = new Promise((resolve)=>{
            pResolveStart = resolve
        })


        const r =  async ()=>{
            await pStart
            try {
                return await fn()
            } finally {
                // remove us
                s.shift()

                // next to execute
                if(s.length) {
                    s[0]()
                }
            }
        }
        
        pResolveStart.promise = r()
        return pResolveStart
    }
    static async fn(s, fn){
        if(s.length === 0){
            s.push(fn)
            try {
                return await fn()
            } finally {
                // remove us
                s.shift()

                // next to execute
                if(s.length) {
                    s[0]()
                }
            }
        } else {
            const execFn = SyncLite._execFn(s, fn)
            s.push(execFn)
            return await execFn.promise
        }
    }
    static init(){
        return []
    }
}
module.exports = SyncLite