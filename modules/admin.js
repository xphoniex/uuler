// admin.js

const bitcore 	= require('bitcore-lib')
const config 		= require('./config.js')
const DB 				= new (require('./rdb.js'))
const BigNumber = require('bignumber.js')

module.exports = function(app) {

function checkAuthentication(req, res, next) {
	if (req.isAuthenticated())
		next()
	else
		res.redirect("/login")
}

app.post('/api/paydue', checkAuthentication, async function(req,res, next) {
	const publicKey = req.body.publicKey
	const privateKey = req.body.privateKey

	await DB.freezeAddress(publicKey)

	proccessDues(publicKey, privateKey, function(err, reply) {
		if (err) return res.json({error: err})
		res.json({success: true})
	})
})

app.post('/api/newAddresses', checkAuthentication, function(req, res, next) {
	const addresses = req.body
	DB.insertNewAddresses(addresses)
	.then(res.json.bind(res))
	.catch(console.error)
})

app.get('/api/transactions', checkAuthentication, function(req, res, next) {
	generateSummary()
	.then(res.json.bind(res))
	.catch((error) => res.json.bind(res)({error: error}))
})

function getAddressDues(address) {
	return new Promise(async (resolve, reject) => {
		try {
			var dues = await DB.getAddressDues(address)
			var totalDue = new BigNumber(0)
			for (let i of Object.keys(dues))
				totalDue = totalDue.plus(dues[i])
			resolve({address:address, dues: dues, total: totalDue.toString()})
		} catch (error) {
			reject(error)
		}
	})
}

function generateSummary() {
	return new Promise(async (resolve, reject) => {
		let addresses = await DB.getAvailableAddresses()
		var summary = []
		var zerodue_count = 0
		addresses.forEach((address) => {
			getAddressDues(address)
			.then((dues) => {
				if (dues.total==0)
					zerodue_count++
				else
					summary.push(dues)

				if (summary.length + zerodue_count == addresses.length)
					resolve(summary)
			})
			.catch(reject)
		})
	})
}

async function proccessDues(address, privateKey) {
	try {
		BigNumber.config({ ROUNDING_MODE: 1 }) // 1 = ROUND_DOWN
		let dues = await DB.getAddressDues(address)
		let forwards = Object.keys(dues)
		let utxos = await Btc.getUtxos(address) // TODO promise all dues & utxos
		var commission = new BigNumber(0)
		var transaction = new bitcore.Transaction().fee(config.TRANSACTION_FEE).from(utxos)
		const transactionFee = parseInt(config.TRANSACTION_FEE / forwards.length) + 1
		for (let i = 0 ; i < forwards.length ; ++i) {
			let amount = new BigNumber(dues[forwards[i]])
			commission = commission.plus( amount.multipliedBy(config.COMMISSION) )
			transaction = transaction.to(forwards[i], amount.multipliedBy(1-config.COMMISSION).minus(transactionFee).toFixed(0))
		}
		transaction = transaction.to(config.COMMISSION_ADDRESS, commission.toFixed(0)).change(address).sign(privateKey).checkedSerialize()
		await Btc.sendTransaction(transaction)
	} catch (error) {
		console.error(error)
	}
}
//
}
