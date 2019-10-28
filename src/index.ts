import ipfs from 'ipfs'
export const ipfsOptions = {
    repo: `./orbitdb/default/ipfs`,
    relay: { enabled: true, hop: { enabled: true, active: true } },
    EXPERIMENTAL: {
      pubsub: true,
      dht: true,
    },
    libp2p: {
        config: {
            dht: {
                enabled: true
            }
        }
    }
}
async function init(){
    let node = new ipfs(ipfsOptions)
    node.on('error', error => console.error(error.message))
    await new Promise((resolve, reject) => {node.on('ready', resolve)})
    return node
}
var node: ipfs
init().then(async (n: ipfs)=>{
    node = n
    console.log("started ipfs")
    console.log(await node.cat("QmT78zSuBmuS4z925WZfrqQ1qHaJ56DQaTfyMUF7F8ff5o"))
})
self.addEventListener('install', function(evt) {
    console.log('The service worker is being installed.');  
});
  