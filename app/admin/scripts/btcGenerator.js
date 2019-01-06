var window = {};

importScripts('/bower_components/bitcore-lib/bitcore-lib.min.js');

window.crypto = self.crypto;

var bitcore = require('bitcore-lib');

onmessage = function(e) {

	var id = e.data.id;

    for (var i = 0 ; i < e.data.q ; i++) {

    	var privateKey = new bitcore.PrivateKey();
		var address = privateKey.toAddress();

    	postMessage({public: address.toString(), private: privateKey.toString(), id: id});
    }

    postMessage({finish:true, id:id});
};