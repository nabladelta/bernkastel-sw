const _self: SharedWorker.SharedWorkerGlobalScope = self as any
import {initIPFS, initOrbit, Thread} from 'bernkastel'
import IPFS from 'ipfs'
import OrbitDB from 'orbit-db'
var threads: {[key: string]: Thread} = {} // each thread object contains a database
var ipfs: IPFS
var orbit: OrbitDB
function getAddr(obj: any){
    return `${obj.root}/${obj.path}`
}
_self.onconnect = async e => {
    let port = e.ports[0]
    port.start()
    if (!ipfs) ipfs = new IPFS({repo: "./orbitdb/default"})
    // @ts-ignore
    await ipfs.ready
    if (!orbit) orbit = await initOrbit(ipfs, { directory: `./orbitdb/default/orbitdb` })
    
    port.onmessage = async e => {
        port.postMessage({id: (await ipfs.id()).id})
        console.log(e.data)
        if (e.data.op === 'open'){
            var threadAddress = e.data.address
            if (!threads[e.data.address]){
                var options = {ipfs, orbit, address: e.data.address}
                console.log(options)
                const thread = new Thread(options)
                await thread.ready
                threadAddress = getAddr(thread.db.address)
                threads[threadAddress] = thread
            }
            threads[threadAddress].bindOnReplicated((a)=> {
                port.postMessage({op: "update", address: threadAddress, update: threads[threadAddress].posts})
                console.log("replicated")
            })
            port.postMessage({op: "update", address: threadAddress, update: threads[threadAddress].posts})
        }
        if (e.data.op === 'post'){
            console.log(e.data.address)
            if (!threads[e.data.address]){
                port.postMessage({op:'post', r: false, hash: null})
                return
            }
            const hash = await threads[e.data.address].post({time: Date.now(), message: e.data.message})
            port.postMessage({op:'post', r: true, hash})
            port.postMessage({op: "update", address: e.data.address, update: threads[e.data.address].posts})
            return
        }
        if (e.data.op === 'connect'){
            console.log("connecting")
            await ipfs.swarm.connect(e.data.peer)
            console.log("connecting complete")
            return
        }
    }
};