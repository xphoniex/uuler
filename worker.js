// worker.js

const bitcore 	= require('bitcore-lib')
const DB 				= new (require('./modules/rdb.js'))
const BigNumber = require('bignumber.js')

var addresses = {} // maps addresses[address] => invoice(address)

let transactionHandler = (txBuffer) => {
	let tx = bitcore.Transaction().fromBuffer(txBuffer)
	for (var i = 0; i < tx.outputs.length; ++i)
		transactionOutputHandler(tx.outputs[i])
}

const Btc = new (require('./modules/btc.js'))(transactionHandler)

let transactionOutputHandler = (output) => {
  if (!output.script)
    return
  let address = output.script.toAddress(Btc.node.network).toString()
  if (addresses[address] === undefined) return
  addresses[address].currentBalance = addresses[address].currentBalance.plus(output.satoshis)
  if (addresses[address].currentBalance.gte(addresses[address].target))
    gotPaid(address)
}

const redis 	= require('redis')
const client 	= redis.createClient()
const sub     = redis.createClient()
const pub     = redis.createClient()

sub.subscribe("checkForPayment")
sub.on("message", (_, address) => grabInvoice(address))

let grabInvoice = async (address) => {
  console.log(`[grabbing] invoice:${address}`)
  var invoice = await DB.invoiceOfBtcAddress(address)
  if (!invoice)
    return

	let balance = await Btc.balanceOf(address)
  invoice.currentBalance = new BigNumber(balance)
	console.log(`[grabbing] invoice:`)
	console.log(invoice)

  if (addresses[address] === undefined)
		addresses[address] = invoice
	else
		return // why would we even end up here?

  // clean this in 5-10 mins
  setTimeout(() => {
    gotExpired(address)
  }, 5*60*1000) // TODO: sync with invoice creation time
}

let loadFromList = async () => {
  let addresses = await DB.getReservedAddresses()

  addresses.forEach((address) => {
    if (addresses[address] === undefined)
      grabInvoice(address)
  })
}

let gotPaid = (address) => {
  console.log(`[paid] address:${address}`)
  var invoice = addresses[address]
  invoice.paid = true
  var full_invoice = 'i-' + invoice.invoiceString + '-{' + address + '}'
  var invoice_rec = JSON.parse(JSON.stringify(invoice))

  delete invoice.forward
  delete invoice.target
  delete invoice.currentBalance // nu TODO : clean nu
  delete invoice_rec.currentBalance // nu

  client.multi([
      ['set', full_invoice, JSON.stringify(invoice)], 												                   // 1. UPDATE INVOICE i-[]-{}
      ['lpush', '{'+address+'}-rec', JSON.stringify(invoice_rec)],									             // 2. INSERT RECEIPT to {btc}-rec list
      ['del', 'for-{'+address+'}'],																                               // 3. DELETE for-{btc}
      ['hincrby', ('{' + address + '}-due'), invoice_rec.forward, invoice_rec.amount], 					 // 4. UPDATE DUE BALANCE FOR FORWARD ADDRESS
      ['lrem', 'reserved', 0, address],                                                          // 5. REMOVE FROM RESERVED
      ['lpush', 'available', address]                                                            // 6. PUSH BACK TO AVAILABLE
  ]).exec(function (error, replies) {
    if (error) {
      console.error(error)
      return // TODO: try again?
    }
    pub.publish("PAID", invoice.invoiceString + '-' + address)	                               	// 7. PUBLISH IT!
    delete addresses[address]
  })
}

let gotExpired = (address) => {
	if (addresses[address] == undefined) return
  console.log(`[expired] address:${address}`)
  const invoice = addresses[address]
  const full_invoice = 'i-' + invoice.invoiceString + '-{' + address + '}'
  delete addresses[address]
  client.multi([
      ['del', full_invoice], 												                                             // 1. UPDATE INVOICE i-[]-{}
      ['del', 'for-{'+address+'}'],																                               // 2. DELETE for-{btc}
      ['lrem', 'reserved', 0, address],                                                          // 3. REMOVE FROM RESERVED
      ['lpush', 'available', address]                                                            // 4. PUSH BACK TO AVAILABLE
  ]).exec(function (error, replies) {
    if (error) return // TODO: try again?
  })
}

let checkForMismatch = async () => {
	// checks if there's a mistmatch between DB list & our list
  var lenOfList = -1
  DB.lenOfList('reserved')
  .then((len) => lenOfList = len )
  .catch((err) => {
    console.error(err)
    lenOfList = -2
  })

  lenOfObj = Object.keys(addresses).length
  while (lenOfList == -1) { await pauseForIO() } // wait till db is resolved
  console.log(`[check mismatch] len of: addresses=[${lenOfObj}] db=[${lenOfList}] `)
  if (lenOfList < 0) return  // should not happen

  if (lenOfObj < lenOfList) {
    loadFromList()
  }
}

let pauseForIO = () => {
  return new Promise(resolve => setImmediate(resolve))
}

setInterval(checkForMismatch, 10000)
checkForMismatch()
