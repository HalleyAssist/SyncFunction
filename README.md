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