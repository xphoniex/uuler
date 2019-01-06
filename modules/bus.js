// bus.js

const redis   = require('redis')
const sub     = redis.createClient()
const Invoice = require('./invoice.js')()

module.exports = function(io) {

io.on('connection', function(client) {
  /***************************************************
  * @param invoice : e.g invoiceString-btc
  *
  * @check if already paid in case it's a reconnect
  ****************************************************/
  client.on('join', async function(invoice_string) {
    if (!invoice_string) return // TODO: proper check of input
    client.join(invoice_string)
    let invoice = await Invoice.retrieveFullInvoice(invoice_string)
    if (invoice.paid)
      io.sockets.in(invoice_string).emit('content', invoice.content)
    // TODO: drop connection with client here since nothing else to do
  })
  client.on('disconnect', function(){})
})

sub.subscribe("PAID")
sub.on("message", async function(channel, message) {
  let invoice = await Invoice.retrieveFullInvoice(message)
  invoice.target = null
  invoice.forward = null
  if (invoice.paid)
    io.sockets.in(message).emit('content', invoice.content)
})
//
}
