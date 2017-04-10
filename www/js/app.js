angular.module('App', ['ionic', 'highcharts-ng'])

//the $q service implements asynchronous programming: https://docs.angularjs.org/api/ng/service/$q
//credit due here: http://sravi-kiran.blogspot.com/2014/01/CreatingATodoListUsingIndexedDbAndAngularJs.html
.factory("indexDBService", function($window, $q) {
  
  var indexDBService = {};
  
  var indexedDB = $window.indexedDB;
  var db = null;
  var lastIndex = 0;
  
  // OPEN the database -------------------------------------------------------//
  indexDBService.open = function(){
    var deferred = $q.defer();
    var version = 1;
    var request = indexedDB.open("bitcoinRatesData", version);
    request.onupgradeneeded = function(e) {
      
      //get database
      db = e.target.result;
      
      //in case of error
      e.target.transaction.onerror = indexedDB.onerror;
      
      
      if(db.objectStoreNames.contains("rates")) {
        db.deleteObjectStore("rates");
      }
      var store = db.createObjectStore("rates", {keyPath: "id"});
    };
    request.onsuccess = function(e) {
      db = e.target.result;
      deferred.resolve();
    };
    request.onerror = function(){
      deferred.reject();
    };
     
    return deferred.promise;
  };  
  
  // GET RATES ---------------------------------------------------------------//
  indexDBService.getRates = function(){
    var deferred = $q.defer();
     
    if(db === null){
      deferred.reject("IndexDB is not opened yet!");
    }
    else{
      var trans = db.transaction(["rates"], "readwrite");
      var store = trans.objectStore("rates");
      var rates = [];
     
      // Get everything in the store;
      var keyRange = IDBKeyRange.lowerBound(0);
      var cursorRequest = store.openCursor(keyRange);
     
      cursorRequest.onsuccess = function(e) {
        var result = e.target.result;
        if(result === null || result === undefined)
        {
          deferred.resolve(rates);
        }
        else{
          rates.push(result.value);
          if(result.value.id > lastIndex){
            lastIndex=result.value.id;
          }
          result.continue();
        }
      };
     
      cursorRequest.onerror = function(e){
        console.log(e.value);
        deferred.reject("Something went wrong!!!");
      };
    }
   
    return deferred.promise;
  };
  
  // ADD RATES ---------------------------------------------------------------//
  indexDBService.addRates = function(rateData){
    
    var deferred = $q.defer();
     
    if(db === null){
      deferred.reject("IndexDB is not opened yet!");
    }
    else{
      var trans = db.transaction(["rates"], "readwrite");
      var store = trans.objectStore("rates");
      lastIndex++;
      var request = store.put({
        "id": lastIndex,
        "ratedata": rateData
      });
     
      request.onsuccess = function(e) {
        deferred.resolve();
      };
     
      request.onerror = function(e) {
        console.log(e.value);
        deferred.reject("Rate Data item couldn't be added!");
      };
    }
    return deferred.promise;
  };
  
  // DELETE RATES ------------------------------------------------------------//
  indexDBService.deleteRates = function(id){
    
    var deferred = $q.defer();
     
    if(db === null){
      deferred.reject("IndexDB is not opened yet!");
    }
    else{
      var trans = db.transaction(["rates"], "readwrite");
      var store = trans.objectStore("rates");
     
      var request = store.delete(id);
     
      request.onsuccess = function(e) {
        deferred.resolve();
      };
     
      request.onerror = function(e) {
        console.log(e.value);
        deferred.reject("Rates item couldn't be deleted");
      };
    }
     
    return deferred.promise;
  };  
  
  //return the service object
  return indexDBService;
    
})

.config(function ($stateProvider, $urlRouterProvider) {

  $stateProvider
    .state('tabs', {
      url: '/tabs',
      abstract: true,
      templateUrl: 'views/tabs/tabs.html'
    })
    .state('tabs.rates', {
      url: '/rates',
      views: {
        'rates-tab': {
          templateUrl: 'views/rates/rates.html',
          controller: 'RatesController as rc'
        }
      }
    })
    .state('tabs.history', {
      url: '/history?currency',
      views: {
        'history-tab': {
          templateUrl: 'views/history/history.html',
          controller: 'HistoryController'
        }
      }
    })
    .state('tabs.currencies', {
      url: '/currencies',
      views: {
        'currencies-tab': {
          templateUrl: 'views/currencies/currencies.html',
          controller: 'CurrenciesController'
        }
      }
    })
    .state('tabs.detail', {
      url: '/detail/:currency',
      views: {
        'rates-tab': {
          templateUrl: 'views/detail/detail.html',
          controller: 'DetailController'
        }
      }
    });

  $urlRouterProvider.otherwise('/tabs/rates');
})

.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    if(window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if(window.StatusBar) {
      StatusBar.styleDefault();
    }
  });
})

.factory('Currencies', function () {
  return [
    { code: 'AUD', text: 'Australian Dollar', selected: true },
    { code: 'BRL', text: 'Brazilian Real', selected: false },
    { code: 'CAD', text: 'Canadian Dollar', selected: true },
    //{ code: 'CHF', text: 'Swiss Franc', selected: false },
    { code: 'CNY', text: 'Chinese Yuan', selected: true},
    { code: 'EUR', text: 'Euro', selected: true },
    { code: 'GBP', text: 'British Pound Sterling', selected: true },
    { code: 'IDR', text: 'Indonesian Rupiah', selected: false },
    { code: 'ILS', text: 'Israeli New Sheqel', selected: false },
    { code: 'MXN', text: 'Mexican Peso', selected: true },
    { code: 'NOK', text: 'Norwegian Krone', selected: false },
    { code: 'NZD', text: 'New Zealand Dollar', selected: false },
    { code: 'PLN', text: 'Polish Zloty', selected: false },
    { code: 'RON', text: 'Romanian Leu', selected: false },
    { code: 'RUB', text: 'Russian Ruble', selected: true },
    { code: 'SEK', text: 'Swedish Krona', selected: false },
    { code: 'SGD', text: 'Singapore Dollar', selected: false },
    { code: 'USD', text: 'United States Dollar', selected: true },
    { code: 'ZAR', text: 'South African Rand', selected: false }
  ];
});