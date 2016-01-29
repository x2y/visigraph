'use strict';

describe('Graphs E2E Tests:', function () {
  describe('Test graphs page', function () {
    it('Should report missing credentials', function () {
      browser.get('http://localhost:3001/graphs');
      expect(element.all(by.repeater('graph in graphs')).count()).toEqual(0);
    });
  });
});
