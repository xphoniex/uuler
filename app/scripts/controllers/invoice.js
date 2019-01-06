'use strict';

/**
 * @ngdoc function
 * @name uulerApp.controller:InvoiceCtrl
 * @description
 * # InvoiceCtrl
 * Controller of the uulerApp
 */
angular.module('uulerApp')
  .controller('InvoiceCtrl', function ($scope, $http, $routeParams, currentInvoice, $window) {

  	$scope.invoiceLink = $window.location;

  	var time = 5 * 60;

  	$scope.invoice = currentInvoice.is();

  	if (typeof $scope.invoice == 'undefined') { 		
  
  		$http.get('/api/invoice/'+$routeParams.invoiceLink) // todo : sanitize param
			.then(function(data) {
			    //console.log(data.data);
			    $scope.invoice = data.data;
			    invoiceIt();
			})
			.catch(function(data) {
			    console.log('Error: ' + data);
			});

  	} else
  		invoiceIt ();

	var socket = io.connect('http://localhost:8080');

	socket.on('connect', function(data) {
	    socket.emit('join', $routeParams.invoiceLink);
	});

	socket.on('content', function(data) {
		// invoice is paid, content is received
		$scope.invoice.content = data;
		$scope.displayItem = true;
		$scope.displayInvoice = false;
	    socket.disconnect();
	});

  	function invoiceIt () {
  		
  		if ($scope.invoice.expired == true)
  		{
  			socket.disconnect();
  			$scope.displayExpired = true;
  		} else if ($scope.invoice.paid == true) {
  			$scope.displayInvoice = false;
  			$scope.displayItem = true;
  			socket.disconnect();
  		} else {
  			$scope.displayInvoice = true;

  			if (document.getElementById("qrcode") != null)
				new QRCode(document.getElementById("qrcode"), {text: "bibpay://invoice?s="+$scope.invoice.address, correctLevel: QRCode.CorrectLevel.H});
			else
				setTimeout(function() {new QRCode(document.getElementById("qrcode"), {text: "bibpay://invoice?s="+$scope.invoice.address, correctLevel: QRCode.CorrectLevel.H});},100);


  			time += $scope.invoice.created - $scope.invoice.now;
  			$scope.minute = "00", $scope.second = "00", time -= 1;

  			if (time>0)
  				setTimeout(function() {$scope.countDown();},1000);
  		}
  	}

  	$scope.countDown = function() {

  		$scope.$apply(function() {
  			$scope.minute = (time / 60) | 0;
  			$scope.second = (time % 60) | 0;
  			
  			$scope.minute = $scope.minute < 10 ? "0" + $scope.minute : $scope.minute;
        	$scope.second = $scope.second < 10 ? "0" + $scope.second : $scope.second;

  		});

  		time -= 1;

  		if (time >= 0)	setTimeout(function() {$scope.countDown();},1000);
  		else $scope.minute = '00', $scope.second = '00';
  	}

  	$scope.test = function() {
  		$scope.displayInvoice = false;
  	}




  });


             