// invoice.js

const redis     = require('redis')
const crypto    = require('crypto')
const pub       = redis.createClient()
const DB        = new (require('./rdb.js'))
const Btc       = new (require('./btc.js'))(transactionHandler=null, spawn=false)
const BigNumber = require('bignumber.js')

module.exports = function() {

return {

/**
 *  @param public_string
 *
 *  @return (JSON) complete invoice
 */
invoiceForPublic: function(public_string) {
  return new Promise(async (resolve, reject) => {
    let btc = await reserveBTC()
    generateInvoice(public_string, btc, (error, invoice) => {
      if (error) return reject(new Error(error))
      resolve(invoice)
    })
  })
},

/**
 *  @param invoiceString
 *
 *  @return invoice if paid otherwise null
 */
alreadyPaid: function(invoiceString) {
  return new Promise(async (resolve, reject) => {
    const invoice_string = invoiceString.replace("-","-{") + "}"
    let invoice = await DB.getInvoice(invoice_string)
    if (!invoice)
      return reject(new Error('Invoice not available'))
    if (invoice.paid)
      return resolve(invoice)
    resolve(null)
  })
},

/**
 *  @param invoiceString
 *
 *  @return invoice
 */
retrieveFullInvoice: function(invoiceString) {
  return new Promise(async (resolve, reject) => {
    const invoice_string = invoiceString.replace("-","-{") + "}"
    let invoice = await DB.getInvoice(invoice_string)
    if (!invoice)
      return reject(new Error('Invoice not available'))
    resolve(invoice)
  })
},

}

/**
 *  moves a btc address from available to reserved list
 *
 *  @return {address:, balance:,}
 */
function reserveBTC() {
  return new Promise(async (resolve, reject) => {
    const address = await DB.reserveAddress()
    if (!address)
      return reject(new Error('No address available'))

    const balance = await Btc.balanceOf(address)
    resolve({address: address, balance: balance})
  })
}

/**
 *  @param public_string
 *  @param btc {address:, balance:,}
 *  @param callback
 *
 *  @return callback((JSON)invoice)
 */
async function generateInvoice(public_string, btc, callback) {

  const item = await DB.getItem(public_string)
  if (!item)
    return callback(`Item can't be retrieved!`, null)

  const invoice_string = crypto.randomBytes(20).toString('hex')
  const seconds = parseInt( new Date().getTime() / 1000 )

  var invoice = {
      content: item.content,
      amount: item.amount,
      address: btc.address,
      paid: false,
      created: seconds
  }

  await DB.setInvoice(invoice_string, btc.address, invoice)

  // we add payment forwarding address here
  invoice.forward = item.address
  invoice.target = new BigNumber(btc.balance).plus(item.amount).toString() 
  invoice.invoiceString = invoice_string

  await DB.setAddressInvoice(btc.address, invoice)
  pub.publish("checkForPayment", btc.address)  // TODO: check if anyone read (return value > 0) otherwise re-try K=3 times
  invoice.target = null
  invoice.forward = null
  invoice.content = null
  callback(null, invoice)
}
//
}
