// routes.js

const crypto 	= require('crypto')
const config  = require('./config.js')
const Invoice = require('./invoice.js')()
const DB 			= new (require('./rdb.js'))

module.exports = function(app, passport) {

require('./passport.js')(app, passport)

/**
 *  SAVE NEW ITEM = POST @ /api/new
 *
 *  @param { content, amound, address, merchant }
 *
 *  @db::save (random_40_public_string : { merchant:,content:,address:,amount:})
 *  @db::save (random_40_admin_string : random_40_public_string)
 *
 *  @return { adminString: admin_string, publicString: public_string }
 */

app.post('/api/new', function(req, res, next) {
	const public_string = crypto.randomBytes(20).toString('hex')
	const admin_string  = crypto.randomBytes(20).toString('hex') // TODO : compare with utils.uid(24)

	// only if req.body.merchant exists
	if (req.body.merchant == '') return
	const item = {
			merchant: req.body.merchant,
			content : req.body.content,
			address : req.body.address,
			amount  : parseInt(req.body.amount*100000000)
	}

	DB.setItemForString(item, public_string, admin_string)
	.then(res.json.bind(res))
	.catch(console.error)
})

/**
 *  PUBLIC ITEM PAGE = POST @ /api/public
 *  generates a unique invoice for the item
 *
 *  @param public_string
 *  @param buyer_uuid - TODO
 *
 *  @return invoice
 */

 app.post('/api/public', async function(req,res, next) {
	 const public_string = req.body.publicString
	 let invoice = await Invoice.invoiceForPublic(public_string)
	 invoice.now = parseInt( new Date().getTime() / 1000 ) // for user to sync on invoice page
	 res.json(invoice)
 })

/**
 *  INVOICE (PRIVATE) PAGE = GET @ /api/invoice
 *
 *  @param invoice_string
 *  @return invoice (+ content if paid)
 */

app.get('/api/invoice/:string', async function(req,res, next) {
	const invoice_string = req.params.string.replace("-","-{") + "}"
	var invoice = await DB.getInvoice(invoice_string)
	if (!invoice)
		return res.json()
	invoice.now = parseInt( new Date().getTime() / 1000 )

	if (invoice.paid)
		return res.json(invoice)

	const seconds = parseInt( new Date().getTime() / 1000 )
	if ( seconds - invoice.created > config.TIME_LIMIT )
			return res.json ({expired:true})
	invoice.content = null
	res.json(invoice)
})

// admin routes
require('./admin.js')(app)
//
}
