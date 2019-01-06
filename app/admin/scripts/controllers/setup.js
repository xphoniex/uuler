'use strict';

/**
 * @ngdoc function
 * @name uulerApp.controller:InvoiceCtrl
 * @description
 * # SetupCtrl
 * Controller of the uulerApp
 */
angular.module('uulerApp')
  .controller('SetupCtrl', function ($scope, $http, $routeParams, currentInvoice, $window, $route) {

    $scope.$route = $route;
    $scope.generatedSofar = 0;

    var generatedBtcs = {};
    var publics = [];

    var cores = navigator.hardwareConcurrency;
    cores = cores > 1 ? cores - 1 : 1;
    
    var bitcore = require('bitcore-lib');

    $scope.generateBtc = function() {

      newSetup();
      
      $scope.generatedSofar = 0;

      $('#progressBar').progress({
        percent: 0
      });

      var i = $scope.btcToGenerate; 

      $scope.step = 100 / i;
      
      if (window.Worker) {

        // using webworkers
        var perWorker = parseInt(i / (cores));
        var extra = i % (cores);

        var workers = new Array(cores);
        var removedWorkers = 0;

        var digester = setInterval(function(){ $scope.$digest(); }, 100);

        for (var wIndex = 0; wIndex < cores; ++wIndex) {
          
          workers[wIndex] = new Worker("scripts/btcGenerator.js");
          
          if (wIndex == 0)
            workers[0].postMessage({id:wIndex, q:perWorker + extra});
          else
            workers[wIndex].postMessage({id:wIndex, q:perWorker});

          workers[wIndex].onmessage = function(event){
              
              if (event.data.finish){
                workers[event.data.id].terminate();
                removedWorkers++;
                if (removedWorkers == cores) {
                  digester = null;
                  $scope.$apply();
                  document.getElementById('link').href = URL.createObjectURL( new Blob([JSON.stringify(generatedBtcs)], {type: "application/json"}) );
                  $scope.downloadReady = true;

                  $scope.downloadActive = true;
                  $scope.stepsFinished = false;
                }
              }
              else {

                $scope.generatedSofar += $scope.step;

                $('#progressBar').progress({
                  percent: $scope.generatedSofar
                });



                //delete event.data.id;
                //generatedTest.push(event.data);

                //generatedTest.push({event.data.public : event.data.private});
                generatedBtcs[event.data.public] = event.data.private;
                publics.push(event.data.public);

                $scope.currentAddress = event.data.public;

                //$scope.generatedBtcs.push(event.data);
                //$scope.$apply();
              
              }

          };
        }
      } else {

        // single-threaded
        if (i > 0) {
          var sleepTime = 0;
          for (var j = 0 ; j < i ; ++j) {
            setTimeout(generateKey,sleepTime);
            sleepTime += 120;
          }
        }
      }

    }

    function generateKey() {

      var privateKey = new bitcore.PrivateKey();
      var address = privateKey.toAddress();
      
      generatedBtcs[address] = privateKey;
      publics.push(address);
      $scope.currentAddress = address;

      $scope.generatedSofar += $scope.step;
      $scope.$apply();
      
      $('#progressBar').progress({
        percent: $scope.generatedSofar
      });
    }

    $scope.jsonDownload = function() {

      $scope.showSync = true;

      $scope.downloadActive = false;
      $scope.syncActive = true;

    }

    $scope.Sync = function() {

      $http.post('/api/newAddresses', publics)
      .then(function(data) {

        console.log(data.data);
        //$scope.syncActive = false;
        $scope.syncCompleted = true;
        $scope.stepsFinished = true;

      })
      .catch(function(data) {

        // todo production show error
        $scope.syncError = true;

      })
    }

    var newSetup = function() {
      $scope.syncError = false;
      $scope.downloadReady = false;
      $scope.stepsFinished = false;
      $scope.syncCompleted = false;
    }

  });



             