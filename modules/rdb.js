// rdb.js

const redis = require('redis')

class RDB {
  constructor() {
  this.client = redis.createClient()


  /**
   *  @param: (JSON)item, public_string, admin_string
   *  @return {adminString: _, publicString: _}
   */
  this.setItemForString = (item, public_string, admin_string) => {
    return new Promise((resolve, reject) => {
      this.client.multi([
        ["set", 'p-'+public_string, JSON.stringify(item)],
        ["set", 'a-'+admin_string, 'p-'+public_string]
      ]).exec(function (error, replies) {
        if (error) return reject(new Error(error))
        resolve({adminString: admin_string, publicString: public_string}) // we don't actually need to return any object, only it makes it simpler for consumer
      })
    })
  }

  /**
   *  @param: invoice_string, btc_adr, (JSON) invoice
   *  @return: onSucces true else error
   */
  this.setInvoice = (invoice_string, btc_adr, invoice) => {
    return new Promise((resolve, reject) => {
      this.client.set('i-'+invoice_string+'-{'+btc_adr+'}', JSON.stringify(invoice), function(error, reply) {
        if (error) return reject(new Error(error))
        resolve(true)
      })
    })
  }

  /**
   *  sets invoice for the temp address we just reserved
   *  @param: btc_adr, (JSON) invoice
   *  @return: onSucces true else error
   */
  this.setAddressInvoice = (btc_adr, invoice) => {
    return new Promise((resolve, reject) => {
      this.client.set('for-{' + btc_adr + '}', JSON.stringify(invoice) , function(error, reply) {
        if (error) return reject(new Error(error))
        resolve(true)
      })
    })
  }

  /**
   *  @param: invoice addresses
   *  @return: (JSON) invoice
   */
  this.getInvoice = (invoice) => {
    return new Promise((resolve, reject) => {
      this.client.get('i-' + invoice, function(error, reply) {
        if (error) return reject(new Error(error))
        let invoice = JSON.parse(reply)
        if (!invoice)
          return resolve(null)
        resolve(invoice)
      })
    })
  }

  /**
   *  @param: public_string
   *  @return: (JSON) item
   */
  this.getItem = (public_string) => {
    return new Promise((resolve, reject) => {
      this.client.get('p-' + public_string, function(error, reply) {
        if (error) return reject(new Error(error))
        let item = JSON.parse(reply)
        if (!item)
          return resolve(null)
        resolve(item)
      })
    })
  }

  /**
   *  @return: [] available addresses
   */
  this.getAvailableAddresses = () => {
    return new Promise((resolve, reject) => {
      this.client.lrange("available", 0, -1, function(error, addresses) {
        if (error) return reject(new Error(error))
        resolve(addresses)
      })
    })
  }

  /**
   *  @param: todo - complete this
   *  @return:
   */
  this.getAddressDues = (address) => {
    return new Promise((resolve, reject) => {
      this.client.hgetall("{"+address+"}-due", function(error, dues) {
        if (error) return reject(new Error(error))
        resolve(dues || {})
      })
    })
  }

  /**
   *  @param: addresses
   *  @return: onSuccess {sucess: true} else return error
   */
  this.insertNewAddresses = (addresses) => {
    return new Promise((resolve, reject) => {
      const multi = this.client.multi()
      for (let i = 0; i < addresses.length; ++i)
        multi.rpush('available', addresses[i])
      multi.exec(function(error, results) {
        if (error) return reject(new Error(error))
        resolve({success: true})
      })
    })
  }

  /**
   *  @param:
   *  @return: a reserved address
   */
  this.reserveAddress = () => {
    return new Promise((resolve, reject) => {
      this.client.rpoplpush("available", "reserved", function (error, address) {
        if (error) reject(new Error(error))
        resolve(address)
      })
    })
  }

  /**
   *  @param: address
   *  removes address from available
   *  @return:
   */
  this.freezeAddress = (address) => {
    return new Promise((resolve, reject) => {
      this.client.lrem("available", "0", address, function (error, reply) {
        if (error) reject(new Error(error))
        resolve(reply)
      })
    })
  }

  /**
   *  @param: one of our generated addresses, reserved for this invoice
   *  @return: (JSON) temporary invoice which this address is pointing to atm
   */
  this.invoiceOfBtcAddress = (address) => {
    return new Promise((resolve, reject) => {
      this.client.get('for-{' + address + '}', function(error, reply) {
        if (error) reject(new Error(error))
        let invoice = JSON.parse(reply)
        if (!invoice)
          resolve(null)
        resolve(invoice)
      })
    })
  }

  /**
   *  @param: name of a list
   *  @return: length of that list
   */
  this.lenOfList = (list) => {
    return new Promise((resolve, reject) => {
      this.client.llen(list, function(error, reply) {
        if (error) reject(new Error(error))
        resolve(reply)
      })
    })
  }

  /**
   *  @param: list name
   *  @return: items of the list
   */
   this.getReservedAddresses = () => {
     return new Promise((resolve, reject) => {
       this.client.lrange("reserved", 0, -1, function(error, addresses) {
         if (error) reject(new Error(error))
         resolve(addresses)
       })
     })
   }
  //
  }
}

module.exports = RDB
