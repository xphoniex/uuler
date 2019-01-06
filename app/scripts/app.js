'use strict';

/**
 * @ngdoc overview
 * @name uulerApp
 * @description
 * # uulerApp
 *
 * Main module of the application.
 */
angular
  .module('uulerApp', [
    'ngAnimate',
    'ngCookies',
    'ngResource',
    'ngRoute',
    'ngSanitize',
    'ngTouch',
    'uuid4'
  ])
  .config(function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl',
      })
      .when('/p/:publicLink', {
        templateUrl: 'views/public.html',
        controller: 'PublicCtrl',
      })
      .when('/i/:invoiceLink', {
        templateUrl: 'views/invoice.html',
        controller: 'InvoiceCtrl',
      })
      .otherwise({
        redirectTo: '/',
        
      });
  })
  .factory('currentInvoice', function() {
    
    var invoice;
    
    return {
      is : function(item) {
        if (item)
        {
          console.log("changing item");
          //invoice = {address:item.address, amount:item.amount, content:item.content,} item;
          invoice = item;
          //invoice = { content: item.content, amount: item.amount, address: item.address, paid: item.paid, created: item.created, invoiceString: item.invoiceString};
        }
        return invoice;
      }
    }

}).directive('selectAllOnClick', [function() {
  return {
    restrict: 'A',
    link: function(scope, element, attrs) {
      var hasSelectedAll = false;
      element.on('click', function($event) {
        if (!hasSelectedAll) {
          try {
            //IOs, Safari, thows exception on Chrome etc
            this.selectionStart = 0;
            this.selectionEnd = this.value.length + 1;
            hasSelectedAll = true;
          } catch (err) {
            //Non IOs option if not supported, e.g. Chrome
            this.select();
            hasSelectedAll = true;
          }
        }
      });
      //On blur reset hasSelectedAll to allow full select
      element.on('blur', function($event) {
        hasSelectedAll = false;
      });
    }
  };
}]).directive('highlightText', [function() {
  return {
    link: function(scope, element, attrs) {
      element.on('click', function($event) {
        var range = document.createRange();
        var selection = window.getSelection();

        range.selectNodeContents(document.getElementById(attrs.id));
    
        selection.removeAllRanges();
        selection.addRange(range);
      });

    }
  }

}]);
