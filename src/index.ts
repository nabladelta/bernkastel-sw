const _self: SharedWorker.SharedWorkerGlobalScope = self as any

import {initIPFS, initOrbit, Thread} from 'bernkastel'
import IPFS from 'ipfs'
import OrbitDB from 'orbit-db'
import { Post } from 'bernkastel/dist/src/Post'

var boards: {[key: string]: Thread} = {} // each thread object contains a database
var ipfs: IPFS
var orbit: OrbitDB

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
        const OP = e.data.op
        switch (OP) {
            case 'open': {
                var threadAddress = e.data.address
                if (!boards[e.data.address]){
                    var options = {ipfs, orbit, address: e.data.address, ...e.data.options}
                    console.log(options)
                    const thread = new Thread(options)
                    await thread.ready
                    threadAddress = thread.db.address.toString()
                    boards[threadAddress] = thread
                }

                const boardUpdate = (board: Thread) => ({
                    op: "update",
                    address: threadAddress,
                    update: {
                        threads: board.threads,
                        topics: board.topics
                    }
                })
                
                boards[threadAddress].bindOnReplicated((a) => {
                    port.postMessage(boardUpdate(boards[threadAddress]))
                    console.log("replicated")
                })

                port.postMessage(boardUpdate(boards[threadAddress]))

                port.postMessage({ op: 'options',
                    address: threadAddress,
                    options: {
                        anonymous: boards[threadAddress].anonymous,
                        moderators: boards[threadAddress].moderators
                }})
                return
            }
            case 'delete':
            case 'undelete':
            case 'post': {
                console.log(e.data.address)
                const board = boards[e.data.address]
                if (!board) {
                    port.postMessage({op: OP, hash: null})
                    return
                }
                const post = {time: Date.now(), ...e.data.post} as Post
                var hash: string
                if (OP === 'post') hash = await board.post(post)
                if (OP === 'delete') hash = await board.deletePost(post.delete)
                if (OP === 'undelete') hash = await board.undeletePost(post.delete)

                port.postMessage({op: OP, hash})
                port.postMessage({
                    op: 'update',
                    address: e.data.address, 
                    update: {
                        threads: board.threads,
                        topics: board.topics
                    }
                })
                return
            }
            case 'options': {
                const address = e.data.address
                const options = e.data.options
                boards[address].anonymous = options.anonymous
                boards[address].moderators = options.moderators
                port.postMessage({
                    op: 'options',
                    address: address,
                    options: {
                        anonymous: boards[address].anonymous,
                        moderators: boards[address].moderators
                }})
            }
            case 'connect': {
                console.log("connecting")
                await ipfs.swarm.connect(e.data.peer)
                const peers = await ipfs.swarm.peers()
                port.postMessage({op: 'peers', peers})
                console.log("connecting complete")
                return
            }
        }
    }
}