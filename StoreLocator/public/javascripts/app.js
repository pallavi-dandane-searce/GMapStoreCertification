//var app = angular.module('angularjs_with_Nodejs',[]);
//


(function() {
    var root;

    root = typeof exports !== "undefined" && exports !== null ? exports : this;



    root.app = angular.module("gMapStoreLocator", [ 'ui', 'ui.bootstrap', 'ui.directives', 'ui.compat', 'ngCookies']).config([

        "$stateProvider", "$routeProvider", "$urlRouterProvider", "$locationProvider",  '$provide', function($stateProvider, $routeProvider, $urlRouterProvider, $locationProvider, fileUploadProvider, RestangularProvider, $provide) {

//
        }
    ]).run(function($rootScope, $state, $routeParams, $route) {
        $rootScope.$state = $state;
        $rootScope.$route = $route;
        return $rootScope.$routeParams = $routeParams;
    });


}).call(this);
