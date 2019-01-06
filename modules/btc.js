// btc.js

const index 	= require('bitcore-node')
const Bitcoin = index.services.Bitcoin
const Node 		= index.Node

class BtcNode {
  constructor(transactionHandler = null, spawn = true) {

  var configuration = {
    network: 'regtest',
    services: [
      {
        name: 'bitcoind',
        module: Bitcoin,
        config: {}
      }
    ]
  }

  if (spawn)
    configuration.services[0].config.spawn = { datadir: '/home/user/.bitcoin', exec: '/usr/bin/bitcoind' }
  else
    configuration.services[0].config.connect = [ { rpchost: '127.0.0.1', rpcport: 18443, rpcuser: 'user', rpcpassword: 'pass', zmqpubrawtx: 'tcp://127.0.0.1:28332' } ]

  this.node = new Node(configuration)

  this.node.start(function() {
    //start the node so the node.on('ready') is actually called.
  })

  this.node.on('ready', function() {
    this.ready = true
    console.log('Bitcoin Node Ready')

    if (transactionHandler != null)
    	this.node.services.bitcoind.on('tx', transactionHandler)
  }.bind(this))

  this.node.on('error', function(err) {
    console.error(err)
  })

  // shutdown the node
  //this.node.stop(function() {
    // the shutdown is complete
  //})

  /**
   *  @param: bitcoin address
   *  @return: balance of this address
   */
  this.balanceOf = (address) => {
    return new Promise((resolve, reject) => {
      if (!this.ready) reject(new Error('Node not ready'))
      this.node.services.bitcoind.getAddressBalance(address, false, function(error, total) {
        if (error) return reject(new Error(error))
        resolve(total.balance)
      })
    })
  }

  /**
   *  @param
   *  @return: count of blocks
   */
  this.getBlockCount = () => {
    return new Promise((resolve, reject) => {
      if (!this.ready) reject(new Error('Node not ready'))
      this.node.services.bitcoind.getblockcount(function(error, blocks) {
        if (error) return reject(new Error(error))
        resolve(blocks)
      })
    })
  }

  /**
   *  @param address
   *  @return unsepnt transactions of the address
   */
  this.getUtxos = (address) => {
    return new Promise((resolve, reject) => {
      if (!this.ready) reject(new Error('Node not ready'))
      this.node.services.bitcoind.getAddressUnspentOutputs(address, false, function(error, unspentOutputs) {
        if (error) return reject(new Error(error))
        resolve(unspentOutputs)
      })
    })
  }

  /**
   *  @param transaction hex
   *  @return hash of tx
   */
  this.sendTransaction = (transaction) => {
    return new Promise((resolve, reject) => {
      if (!this.ready) reject(new Error('Node not ready'))
      this.node.services.bitcoind.sendTransaction(transaction, function(error, hash) {
        if (error) return reject(new Error(error))
        resolve(hash)
      })
    })
  }
  //
  }
}

module.exports = BtcNode
