const _self: SharedWorker.SharedWorkerGlobalScope = self as any
import {initIPFS, initOrbit, Thread} from 'bernkastel'
import IPFS from 'ipfs'
import OrbitDB from 'orbit-db'
var threads: {[key: string]: Thread} = {}
var ipfs: IPFS
var orbit: OrbitDB
_self.onconnect = async e => {
    let port = e.ports[0]
    port.start()
    if (!ipfs) ipfs = await initIPFS({})
    if (!orbit) orbit = await initOrbit(ipfs, {})

    port.onmessage = async e => {
        console.log(e.data)
        if (e.data.op === 'open'){
            if (!threads[e.data.address]){
                var options = {ipfs, orbit, address: undefined}
                if (e.data.new) options.address = e.data.address
                threads[e.data.address] = new Thread(options)
                await threads[e.data.address].ready
            }
            threads[e.data.address].bindOnReplicated((a)=>port.postMessage(threads[e.data.address].posts))
            port.postMessage(threads[e.data.address].posts)
        }
        if (e.data.op === 'post'){
            if (!threads[e.data.address]){
                port.postMessage({r: false, hash: null})
                return
            }
            await threads[e.data.address].post({time: Date.now(), message: e.data.message})
            console.log(threads[e.data.address].db.all)
            port.postMessage(threads[e.data.address].posts)
            return
        }
        if (e.data.op === 'connect'){
            await ipfs.swarm.connect(e.data.peer)
            return
        }
    }
};