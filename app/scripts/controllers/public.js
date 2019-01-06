'use strict';

/**
 * @ngdoc function
 * @name uulerApp.controller:PubliccCtrl
 * @description
 * # PubliccCtrl
 * Controller of the uulerApp
 */
angular.module('uulerApp')
  .controller('PublicCtrl', function ($scope, $http, $window, uuid4, $routeParams, $location, currentInvoice) {

	$http.post('/api/public', {publicString: $routeParams.publicLink})
		.then(function(data) {
			
		    $scope.invoice = data.data;
		    //console.log(data.data);
		    //console.log("current invoice is :");
		    currentInvoice.is($scope.invoice);
		    //console.log(currentInvoice.is());
		    $location.path("/i/"+$scope.invoice.invoiceString+"-"+$scope.invoice.address);
		})
		.catch(function(data) {
		    console.log('Error: ' + data);
		});

  });