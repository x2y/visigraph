'use strict';

var should = require('should'),
  request = require('supertest'),
  path = require('path'),
  mongoose = require('mongoose'),
  User = mongoose.model('User'),
  Graph = mongoose.model('Graph'),
  express = require(path.resolve('./config/lib/express'));

/**
 * Globals
 */
var app, agent, credentials, user, graph;

/**
 * Graph routes tests
 */
describe('Graph CRUD tests', function () {

  before(function (done) {
    // Get application
    app = express.init(mongoose);
    agent = request.agent(app);

    done();
  });

  beforeEach(function (done) {
    // Create user credentials
    credentials = {
      username: 'username',
      password: 'M3@n.jsI$Aw3$0m3'
    };

    // Create a new user
    user = new User({
      firstName: 'Full',
      lastName: 'Name',
      displayName: 'Full Name',
      email: 'test@test.com',
      username: credentials.username,
      password: credentials.password,
      provider: 'local'
    });

    // Save a user to the test db and create new graph
    user.save(function () {
      graph = {
        name: 'Graph Name',
        data: 'Graph Data'
      };

      done();
    });
  });

  it('should be able to save a graph if logged in', function (done) {
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }

        // Get the userId
        var userId = user.id;

        // Save a new graph
        agent.post('/api/graphs')
          .send(graph)
          .expect(200)
          .end(function (graphSaveErr, graphSaveRes) {
            // Handle graph save error
            if (graphSaveErr) {
              return done(graphSaveErr);
            }

            // Get a list of graphs
            agent.get('/api/graphs')
              .end(function (graphsGetErr, graphsGetRes) {
                // Handle graph save error
                if (graphsGetErr) {
                  return done(graphsGetErr);
                }

                // Get graphs list
                var graphs = graphsGetRes.body;

                // Set assertions
                (graphs[0].user._id).should.equal(userId);
                (graphs[0].name).should.match('Graph Name');

                // Call the assertion callback
                done();
              });
          });
      });
  });

  it('should not be able to save a graph if not logged in', function (done) {
    agent.post('/api/graphs')
      .send(graph)
      .expect(403)
      .end(function (graphSaveErr, graphSaveRes) {
        // Call the assertion callback
        done(graphSaveErr);
      });
  });

  it('should not be able to save a graph if no name is provided', function (done) {
    // Invalidate name field
    graph.name = '';

    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }

        // Get the userId
        var userId = user.id;

        // Save a new graph
        agent.post('/api/graphs')
          .send(graph)
          .expect(400)
          .end(function (graphSaveErr, graphSaveRes) {
            // Set message assertion
            (graphSaveRes.body.message).should.match('Name cannot be blank');

            // Handle graph save error
            done(graphSaveErr);
          });
      });
  });

  it('should be able to update a graph if signed in', function (done) {
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }

        // Get the userId
        var userId = user.id;

        // Save a new graph
        agent.post('/api/graphs')
          .send(graph)
          .expect(200)
          .end(function (graphSaveErr, graphSaveRes) {
            // Handle graph save error
            if (graphSaveErr) {
              return done(graphSaveErr);
            }

            // Update graph name
            graph.name = 'WHY YOU GOTTA BE SO MEAN?';

            // Update an existing graph
            agent.put('/api/graphs/' + graphSaveRes.body._id)
              .send(graph)
              .expect(200)
              .end(function (graphUpdateErr, graphUpdateRes) {
                // Handle graph update error
                if (graphUpdateErr) {
                  return done(graphUpdateErr);
                }

                // Set assertions
                (graphUpdateRes.body._id).should.equal(graphSaveRes.body._id);
                (graphUpdateRes.body.name).should.match('WHY YOU GOTTA BE SO MEAN?');

                // Call the assertion callback
                done();
              });
          });
      });
  });

  it('should be able to get a list of graphs if not signed in', function (done) {
    // Create new graph model instance
    var graphObj = new Graph(graph);

    // Save the graph
    graphObj.save(function () {
      // Request graphs
      request(app).get('/api/graphs')
        .end(function (req, res) {
          // Set assertion
          res.body.should.be.instanceof(Array).and.have.lengthOf(1);

          // Call the assertion callback
          done();
        });

    });
  });

  it('should be able to get a single graph if not signed in', function (done) {
    // Create new graph model instance
    var graphObj = new Graph(graph);

    // Save the graph
    graphObj.save(function () {
      request(app).get('/api/graphs/' + graphObj._id)
        .end(function (req, res) {
          // Set assertion
          res.body.should.be.instanceof(Object).and.have.property('name', graph.name);

          // Call the assertion callback
          done();
        });
    });
  });

  it('should return proper error for single graph with an invalid Id, if not signed in', function (done) {
    // test is not a valid mongoose Id
    request(app).get('/api/graphs/test')
      .end(function (req, res) {
        // Set assertion
        res.body.should.be.instanceof(Object).and.have.property('message', 'Graph is invalid');

        // Call the assertion callback
        done();
      });
  });

  it('should return proper error for single graph which doesnt exist, if not signed in', function (done) {
    // This is a valid mongoose Id but a non-existent graph
    request(app).get('/api/graphs/559e9cd815f80b4c256a8f41')
      .end(function (req, res) {
        // Set assertion
        res.body.should.be.instanceof(Object).and.have.property('message', 'No graph with that identifier has been found');

        // Call the assertion callback
        done();
      });
  });

  it('should be able to delete a graph if signed in', function (done) {
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }

        // Get the userId
        var userId = user.id;

        // Save a new graph
        agent.post('/api/graphs')
          .send(graph)
          .expect(200)
          .end(function (graphSaveErr, graphSaveRes) {
            // Handle graph save error
            if (graphSaveErr) {
              return done(graphSaveErr);
            }

            // Delete an existing graph
            agent.delete('/api/graphs/' + graphSaveRes.body._id)
              .send(graph)
              .expect(200)
              .end(function (graphDeleteErr, graphDeleteRes) {
                // Handle graph error error
                if (graphDeleteErr) {
                  return done(graphDeleteErr);
                }

                // Set assertions
                (graphDeleteRes.body._id).should.equal(graphSaveRes.body._id);

                // Call the assertion callback
                done();
              });
          });
      });
  });

  it('should not be able to delete a graph if not signed in', function (done) {
    // Set graph user
    graph.user = user;

    // Create new graph model instance
    var graphObj = new Graph(graph);

    // Save the graph
    graphObj.save(function () {
      // Try deleting graph
      request(app).delete('/api/graphs/' + graphObj._id)
        .expect(403)
        .end(function (graphDeleteErr, graphDeleteRes) {
          // Set message assertion
          (graphDeleteRes.body.message).should.match('User is not authorized');

          // Handle graph error error
          done(graphDeleteErr);
        });

    });
  });

  it('should be able to get a single graph that has an orphaned user reference', function (done) {
    // Create orphan user creds
    var _creds = {
      username: 'orphan',
      password: 'M3@n.jsI$Aw3$0m3'
    };

    // Create orphan user
    var _orphan = new User({
      firstName: 'Full',
      lastName: 'Name',
      displayName: 'Full Name',
      email: 'orphan@test.com',
      username: _creds.username,
      password: _creds.password,
      provider: 'local'
    });

    _orphan.save(function (err, orphan) {
      // Handle save error
      if (err) {
        return done(err);
      }

      agent.post('/api/auth/signin')
        .send(_creds)
        .expect(200)
        .end(function (signinErr, signinRes) {
          // Handle signin error
          if (signinErr) {
            return done(signinErr);
          }

          // Get the userId
          var orphanId = orphan._id;

          // Save a new graph
          agent.post('/api/graphs')
            .send(graph)
            .expect(200)
            .end(function (graphSaveErr, graphSaveRes) {
              // Handle graph save error
              if (graphSaveErr) {
                return done(graphSaveErr);
              }

              // Set assertions on new graph
              (graphSaveRes.body.name).should.equal(graph.name);
              should.exist(graphSaveRes.body.user);
              should.equal(graphSaveRes.body.user._id, orphanId);

              // force the graph to have an orphaned user reference
              orphan.remove(function () {
                // now signin with valid user
                agent.post('/api/auth/signin')
                  .send(credentials)
                  .expect(200)
                  .end(function (err, res) {
                    // Handle signin error
                    if (err) {
                      return done(err);
                    }

                    // Get the graph
                    agent.get('/api/graphs/' + graphSaveRes.body._id)
                      .expect(200)
                      .end(function (graphInfoErr, graphInfoRes) {
                        // Handle graph error
                        if (graphInfoErr) {
                          return done(graphInfoErr);
                        }

                        // Set assertions
                        (graphInfoRes.body._id).should.equal(graphSaveRes.body._id);
                        (graphInfoRes.body.name).should.equal(graph.name);
                        should.equal(graphInfoRes.body.user, undefined);

                        // Call the assertion callback
                        done();
                      });
                  });
              });
            });
        });
    });
  });

  it('should be able to get a single graph if signed in and verify the custom "isCurrentUserOwner" field is set to "true"', function (done) {
    // Create new graph model instance
    graph.user = user;
    var graphObj = new Graph(graph);

    // Save the graph
    graphObj.save(function () {
      agent.post('/api/auth/signin')
        .send(credentials)
        .expect(200)
        .end(function (signinErr, signinRes) {
          // Handle signin error
          if (signinErr) {
            return done(signinErr);
          }

          // Get the userId
          var userId = user.id;

          // Save a new graph
          agent.post('/api/graphs')
            .send(graph)
            .expect(200)
            .end(function (graphSaveErr, graphSaveRes) {
              // Handle graph save error
              if (graphSaveErr) {
                return done(graphSaveErr);
              }

              // Get the graph
              agent.get('/api/graphs/' + graphSaveRes.body._id)
                .expect(200)
                .end(function (graphInfoErr, graphInfoRes) {
                  // Handle graph error
                  if (graphInfoErr) {
                    return done(graphInfoErr);
                  }

                  // Set assertions
                  (graphInfoRes.body._id).should.equal(graphSaveRes.body._id);
                  (graphInfoRes.body.name).should.equal(graph.name);

                  // Assert that the "isCurrentUserOwner" field is set to true since the current User created it
                  (graphInfoRes.body.isCurrentUserOwner).should.equal(true);

                  // Call the assertion callback
                  done();
                });
            });
        });
    });
  });

  it('should be able to get a single graph if not signed in and verify the custom "isCurrentUserOwner" field is set to "false"', function (done) {
    // Create new graph model instance
    var graphObj = new Graph(graph);

    // Save the graph
    graphObj.save(function () {
      request(app).get('/api/graphs/' + graphObj._id)
        .end(function (req, res) {
          // Set assertion
          res.body.should.be.instanceof(Object).and.have.property('name', graph.name);
          // Assert the custom field "isCurrentUserOwner" is set to false for the un-authenticated User
          res.body.should.be.instanceof(Object).and.have.property('isCurrentUserOwner', false);
          // Call the assertion callback
          done();
        });
    });
  });

  it('should be able to get single graph, that a different user created, if logged in & verify the "isCurrentUserOwner" field is set to "false"', function (done) {
    // Create temporary user creds
    var _creds = {
      username: 'temp',
      password: 'M3@n.jsI$Aw3$0m3'
    };

    // Create temporary user
    var _user = new User({
      firstName: 'Full',
      lastName: 'Name',
      displayName: 'Full Name',
      email: 'temp@test.com',
      username: _creds.username,
      password: _creds.password,
      provider: 'local'
    });

    _user.save(function (err, _user) {
      // Handle save error
      if (err) {
        return done(err);
      }

      // Sign in with the user that will create the Graph
      agent.post('/api/auth/signin')
        .send(credentials)
        .expect(200)
        .end(function (signinErr, signinRes) {
          // Handle signin error
          if (signinErr) {
            return done(signinErr);
          }

          // Get the userId
          var userId = user._id;

          // Save a new graph
          agent.post('/api/graphs')
            .send(graph)
            .expect(200)
            .end(function (graphSaveErr, graphSaveRes) {
              // Handle graph save error
              if (graphSaveErr) {
                return done(graphSaveErr);
              }

              // Set assertions on new graph
              (graphSaveRes.body.name).should.equal(graph.name);
              should.exist(graphSaveRes.body.user);
              should.equal(graphSaveRes.body.user._id, userId);

              // now signin with the temporary user
              agent.post('/api/auth/signin')
                .send(_creds)
                .expect(200)
                .end(function (err, res) {
                  // Handle signin error
                  if (err) {
                    return done(err);
                  }

                  // Get the graph
                  agent.get('/api/graphs/' + graphSaveRes.body._id)
                    .expect(200)
                    .end(function (graphInfoErr, graphInfoRes) {
                      // Handle graph error
                      if (graphInfoErr) {
                        return done(graphInfoErr);
                      }

                      // Set assertions
                      (graphInfoRes.body._id).should.equal(graphSaveRes.body._id);
                      (graphInfoRes.body.name).should.equal(graph.name);
                      // Assert that the custom field "isCurrentUserOwner" is set to false since the current User didn't create it
                      (graphInfoRes.body.isCurrentUserOwner).should.equal(false);

                      // Call the assertion callback
                      done();
                    });
                });
            });
        });
    });
  });

  afterEach(function (done) {
    User.remove().exec(function () {
      Graph.remove().exec(done);
    });
  });
});
