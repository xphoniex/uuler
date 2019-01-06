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
  $scope.transactions = [];
 	$scope.form = {};

  var selected = [];
  var keys = {};

  $scope.removeOne = function() {
    for (var i = 0; i < $scope.transactions.length; ++i) {
      if ($scope.transactions[i].address == "1EWYV7BRiJLpKhKRmNrceaajU7VxrA6Z5z") {
        $scope.transactions.splice(i,1);;
        break;
      }
    }
  }

  $http.get('/api/transactions')
    .then(function(data) {

      $scope.transactions = data.data;
      console.log(data.data);

    })
    .catch(function(data) {

    })

  	if ($window.localStorage.getItem("merchant") == null)
  		$window.localStorage.setItem("merchant",uuid4.generate());


    var fileUpload = document.getElementById('fileUpload');

    fileUpload.onchange = function() {
      var fr = new FileReader();

      fr.onload = function(e) { 
        keys = JSON.parse(e.target.result);
        //var result = JSON.parse(e.target.result);
        //console.log(Object.keys(result).length);
        //var formatted = JSON.stringify(result, null, 2);
        //document.getElementById('result').value = formatted;
      }

      fr.readAsText(fileUpload.files.item(0));

    }
    
    $scope.uploadKeys = function() {
      
      fileUpload.click();

    }


    $scope.toggled = function(transaction) {

      var address = transaction.address;

      if (keys[address] === undefined)
        return transaction.selected = false;

      var idx = selected.indexOf(address);

      if (idx > -1)
        selected.splice(idx, 1);
      else
        selected.push(address);

      console.log(selected);

    }

    $scope.approveAll = function() {
      $scope.transactions[3].selected = true;
    }

    


  });