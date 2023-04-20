// Imports the index.js file to be tested.
const server = require('../index'); //TO-DO Make sure the path to your index.js is correctly added
// Importing libraries

// Chai HTTP provides an interface for live integration testing of the API's.
const chai = require('chai');
const chaiHttp = require('chai-http');
chai.should();
chai.use(chaiHttp);
const {assert, expect} = chai;

describe('Server!', () => {
  // Sample test case given to test / endpoint.
  it('Returns the default welcome message', done => {
    chai
      .request(server)
      .get('/welcome')
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body.status).to.equals('success');
        assert.strictEqual(res.body.message, 'Welcome!');
        done();
      });
  });

  // ===========================================================================

  it('positive : /register', done => {
    chai
      .request(server)
      .post('/register')
      .send({username: 'John Dane', password: '1234'})
      .end((err, res) => {
        expect(res).to.have.status(200);
        done();
      });
  });

  // ===========================================================================

  it('Negative : /register. Checking no password', done => {
    chai
      .request(server)
      .post('/register')
      .send({username: 'John Doe', password: ''})
      .end((err, res) => {
        expect(res).to.have.status(201);
        expect(res.body.message).to.equals('No input');
        done();
      });
  });

  // ===========================================================================

  it('positive : /userID', done => {
    chai
      .request(server)
      .post('/userID')
      .send({username: 'John Dane'})
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body.message).to.equals('Success');
        done();
      });
  });

  // ===========================================================================

  it('Negative : /userID. Checking invalid username', done => {
    chai
      .request(server)
      .post('/userID')
      .send({username: 'John'})
      .end((err, res) => {
        expect(res).to.have.status(201);
        expect(res.body.message).to.equals('Invalid username');
        done();
      });
  });
});