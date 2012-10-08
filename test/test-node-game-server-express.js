var express = require('express')
  , assert = require('assert')
  , should = require('should')
  , request = require('superagent')
  , monolith = require('../app/monolith');

var create_server = false;

if (create_server === true) {
	monolith.listen(3000);
	console.log("Express server listening in dev mode on port %d in %s mode", monolith.address().port, monolith.settings.env);
}

describe('request', function() {
	describe('persistent agent', function() {
		var agent1 = request.agent();
		var agent2 = request.agent();
		var agent3 = request.agent();

		it('should be able to get the login page', function(done) {
			agent1
			.get('http://localhost:3000/')
			.end(function(err, res) {
				should.not.exist(err);
				res.should.have.status(200);
				should.exist(res.headers['set-cookie']);
				res.text.should.include('input');
				done();
			});
		});
		
		it('login with a valid username, should get redirected to lobby', function(done) {
			agent1
			.post('http://localhost:3000/login')
			.send({ username: 'jpickard' })
			.end(function(err, res) {
				should.not.exist(err);
				res.should.have.status(200); // After redirect will be 200.
				res.text.should.include('Logged in as jpickard');
				should.exist(res.headers['set-cookie']);
				done();
			});
		});
		
		it('login with an invalid username, should get redirected', function(done) {
			agent2
			.post('http://localhost:3000/login')
			.send({ username: 'nonsense' })
			.end(function(err, res) {
				should.not.exist(err);
				res.should.have.status(200); // After redirect will be 200
				should.exist(res.headers['set-cookie']);
				res.text.should.include('Account not found');
				done();
			});
		});
	});
});

  
