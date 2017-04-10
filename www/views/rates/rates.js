angular.module('App')
.controller('RatesController', function ($scope, $http, $window, $ionicPopover, 
                                         $interval, Currencies, indexDBService) {
                                           
  var rc = this;
  
  rc.currencies = Currencies;
  rc.rates=[];  

  $ionicPopover.fromTemplateUrl('views/rates/help-popover.html', {
    scope: $scope,
  }).then(function (popover) {
    $scope.popover = popover;
  });
  $scope.openHelp = function($event) {
    $scope.popover.show($event);
  };
  $scope.$on('$destroy', function() {
    $scope.popover.remove();
  });

  rc.load = function () {
    $http.get('https://api.bitcoinaverage.com/ticker/all').success(function (tickers) {
      angular.forEach(rc.currencies, function (currency) {
        currency.ticker = tickers[currency.code];
        currency.ticker.timestamp = new Date(currency.ticker.timestamp);
      });
    }).finally(function () {
      $scope.$broadcast('scroll.refreshComplete');
    });
  };
  
  $scope.loadSchedule = function(){
    console.log("load called at: " + Date.now());
    rc.load();
  };
  
  //methods for the indexedDB service
  rc.refreshList = function(){
    indexDBService.getRates().then(function(data){
      
      rc.rates=data;
      
      //write from the temporary to the main
      rc.currencies = rc.rates;      
      
    }, function(err){
      $window.alert(err);
    });
  };
   
  rc.addRates = function(){
    indexDBService.addRates(rc.currencies).then(function(){
      rc.refreshList();
      
      //write from the temporary to the main
      rc.currencies = rc.rates;
    }, function(err){
      $window.alert(err);
    });
  };
   
  rc.deleteRates = function(id){
    indexDBService.deleteRates(id).then(function(){
      rc.refreshList();
    }, function(err){
      $window.alert(err);
    });
  };
   
  rc.init = function(){
    indexDBService.open().then(function(){
      rc.refreshList();
    });
  }

  //try to call from the DB   
  //rc.init();
  
  //call on 1-minute interval
  var promise = $interval($scope.loadSchedule, 60 * 1000);
  
  //call once from the REST service once this controller is loaded
  rc.load();
  
});