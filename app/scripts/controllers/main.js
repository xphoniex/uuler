'use strict';

/**
 * @ngdoc function
 * @name uulerApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the uulerApp
 */
angular.module('uulerApp')
 .controller('MainCtrl', function ($scope, $http, $window, uuid4) {
 	$scope.form = {};

  	if ($window.localStorage.getItem("merchant") == null)
  		$window.localStorage.setItem("merchant",uuid4.generate());

  	$scope.new = function() {

  		console.log($scope.address);

  		var item = {content: $scope.form.content, address: $scope.form.address, amount: $scope.form.amount, merchant: $window.localStorage.getItem("merchant") };

  		$scope.form.isSubmitting = true;

  		$http.post('/api/new', item)
	        .then(function(data) {
            $scope.form.failed = false;
	        	
	        	console.log ("admin is " + data.data.adminString);
	        	$scope.adminLink = data.data.adminString;
	        	$scope.publicLink = $window.location + 'p/' + data.data.publicString;
	        	$scope.done = true;

	            console.log(data);
	        })
	        .catch(function(data) {
	            console.log('Error: ' + data);
              $scope.form.isSubmitting = false;
              $scope.form.failed = true;
	        });
  	}

  	$scope.copy = function() {
  		document.getElementById('publicLink').select(); 
  		try {
  			var successful = document.execCommand('copy');
  			//var msg = successful ? 'successful' : 'unsuccessful';
  			//console.log('Copying text command was ' + msg);
  		} catch (err) {
  			//console.log('Oops, unable to copy');
  		}
  	}


  });