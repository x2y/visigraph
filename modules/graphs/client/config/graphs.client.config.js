(function () {
  'use strict';

  angular
    .module('graphs')
    .run(menuConfig);

  menuConfig.$inject = ['Menus'];

  function menuConfig(Menus) {
    Menus.addMenuItem('topbar', {
      title: 'Graphs',
      state: 'graphs',
      type: 'dropdown',
      roles: ['*']
    });

    // Add the dropdown list item
    Menus.addSubMenuItem('topbar', 'graphs', {
      title: 'List Graphs',
      state: 'graphs.list'
    });

    // Add the dropdown create item
    Menus.addSubMenuItem('topbar', 'graphs', {
      title: 'Create Graph',
      state: 'graphs.create',
      roles: ['user']
    });
  }
})();
