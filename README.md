# SyncFunction

A mutex for synchronization using promises

## Usage as in sequence lock

```
const {SyncFunction} = require('syncfunction') // or SyncQueue

const sync = SyncFunction()
sync(async()=>{
    await [...] // only one at a time
})
await sync(async()=>{
    await [...] // only one at a time
})
```

## Usage as throat

A throat is an asyncronous function that executes work in the background without awaiting on the result. A throat guaruntees no more than `n` functions will be executed at a time.

```
const sync = ThroatFunction(2)
await sync(async()=>{
    await [...] // only 2 at a time
})
await sync(async()=>{
    await [...] // only 2 at a time
})
await sync(async()=>{
    await [...] // only 2 at a time
})

// wait until done
await sync(null)
```


## Usage in a throat queue


A throat is an asyncronous function that executes work in the background with each function call returning an awaitable promise for the underlying call. A throat guaruntees no more than `n` functions will be executed at a time.

## SyncLite usage

A lightweight version of SyncFunction (thats just an array at it's core) for when you need a large number of syncfunctions with minimal cost. Best restricted in use to when it will be able to immediately execute.