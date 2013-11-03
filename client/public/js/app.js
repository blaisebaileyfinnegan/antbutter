var app = angular.module(
  'antbutter',
  [
    'antbutter.services',
    'antbutter.directives',
    'antbutter.filters',
    'antbutter.controllers',
    'ui.bootstrap'
  ],
  function($interpolateProvider) {
    $interpolateProvider.startSymbol('[[');
    $interpolateProvider.endSymbol(']]');
  }
);
