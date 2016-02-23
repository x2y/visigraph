'use strict';

angular.module('graphs').filter('edgePath', function() {
  return function(edge) {
    if (edge.isLinear) {
      return [
        'M',  // Absolute move command.
        edge.from.x,
        edge.from.y,
        edge.to.x,
        edge.to.y,
      ].join(' ');
    } else if (edge.from === edge.to) {
      // Unfortunately SVG arc commands only work for angles < 2π, so to draw a full circle, one
      // needs to use two separate arc commands.
      return [
        'M',  // Absolute move command.
        edge.from.x,
        edge.from.y,
        'A',  // Absolute arc command.
        edge._radius,  // rx.
        edge._radius,  // ry.
        0,  // x-axis-rotation.
        1,  // large-arc-flag.
        1,  // sweep-flag.
        edge.handle.x,  // x.
        edge.handle.y,  // y.
        'A',  // Absolute arc command.
        edge._radius,  // rx.
        edge._radius,  // ry.
        0,  // x-axis-rotation.
        1,  // large-arc-flag.
        1,  // sweep-flag.
        edge.to.x,  // x.
        edge.to.y,  // y.
      ].join(' ');
    } else {
      return [
        'M',  // Absolute move command.
        edge.from.x,
        edge.from.y,
        'A',  // Absolute arc command.
        edge._radius,  // rx.
        edge._radius,  // ry.
        0,  // x-axis-rotation.
        edge._isLargeArc ? 1 : 0,  // large-arc-flag.
        edge._isPositiveArc ? 1 : 0,  // sweep-flag.
        edge.to.x,  // x.
        edge.to.y,  // y.
      ].join(' ');
    }
  };
});
