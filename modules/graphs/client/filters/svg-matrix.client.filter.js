'use strict';

angular.module('graphs').filter('svgMatrix', function() {
  return function(input) {
    return 'matrix(' +
        input[0][0] + ',' + 
        input[1][0] + ',' + 
        input[0][1] + ',' + 
        input[1][1] + ',' + 
        input[0][2] + ',' + 
        input[1][2] + ')';
  };
});

