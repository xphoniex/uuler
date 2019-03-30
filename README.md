# What's *uuler?
*uuler is an online notepad, only you can get paid for your stuff in bitcoin!

# Prerequisites
* [Bitcore Node 3.x](https://github.com/bitpay/bitcore-node)

# Running a server
You need redis-server and a bitcoin node running before starting your server.js.
Running `node worker.js` starts a bitcoin node based on the configurations
in `modules/btc.js` file.

Once you have redis and bitcoin node running simply start by `node server.js`

Before you start taking payments you need to populate your DB with pre-generated
bitcoin addresses. This can be done in `/dashboard` section of the site using
username & password of 'admin'.

# Todo
* Add support for other Cryptocurrencies
* Add support for dynamic pricing (Base price USD)
