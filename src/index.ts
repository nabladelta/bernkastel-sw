const _self: SharedWorker.SharedWorkerGlobalScope = self as any
import {initIPFS} from 'bernkastel'
_self.onconnect = async e => {
    let port = e.ports[0]
    port.start()
    var node = await initIPFS({})
    port.onmessage = async e =>{
        console.log(e.data)
        let item = await node.get(e.data)
        port.postMessage(item)
    }
};