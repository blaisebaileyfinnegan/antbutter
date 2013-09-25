var app = angular.module('antbutter', ['antbutter.services', 'antbutter.directives', 'antbutter.filters', 'antbutter.controllers'], function($interpolateProvider) {
    $interpolateProvider.startSymbol('[[');
    $interpolateProvider.endSymbol(']]');
});
