import supertest from 'supertest';
import { expect } from 'chai';
import app from '../../app';

const request = supertest(app);

const signinUrl = '/api/v1/users/signin';
let adminToken;
const admin = {
  username: 'admin',
  password: process.env.ADMIN_PASSWORD,
};

describe('Test Park Controller', () => {
  describe('# Add a test park', () => {
    before(done => {
      request
        .post(signinUrl)
        .send(admin)
        .end((error, response) => {
          expect(response.statusCode).to.equal(200);
          adminToken = response.body.data.token;
          done();
        });
    });
    it('Should not add a park without a name', done => {
      request
        .post('/api/v1/parks')
        .set('token', adminToken)
        .send({
          parkname: '',
          initialSpots: 5,
          status: 'active',
        })
        .end((error, response) => {
          expect(response.statusCode).to.equal(400);
          expect(response.body).to.be.an('object');
          expect(response.body.errors.parkname).to.equal(
            'Please enter a parkname'
          );
          done();
        });
    });
    it('Should not add a park without specifying initial spots', done => {
      request
        .post('/api/v1/parks')
        .set('token', adminToken)
        .send({
          parkname: 'Rails',
          initialSpots: '',
          status: 'active',
        })
        .end((error, response) => {
          expect(response.statusCode).to.equal(400);
          expect(response.body).to.be.an('object');
          expect(response.body.errors.initialSpots).to.equal(
            'Please estimate the number of spots in your park'
          );
          done();
        });
    });
    it('Should add park', done => {
      request
        .post('/api/v1/parks')
        .set('token', adminToken)
        .send({
          parkname: 'Test Park',
          initialSpots: 2,
          status: 'active',
        })
        .end((error, response) => {
          expect(response.statusCode).to.equal(201);
          expect(response.body).to.be.an('object');
          done();
        });
    });
    it('Should not add a park with the same name', done => {
      request
        .post('/api/v1/parks')
        .set('token', adminToken)
        .send({
          parkname: 'Test Park',
          initialSpots: 2,
          status: 'active',
        })
        .end((error, response) => {
          expect(response.statusCode).to.equal(409);
          expect(response.body).to.be.an('object');
          expect(response.body.errors.title).to.equal('Conflict');
          expect(response.body.errors.detail).to.equal(
            'You already have a park with that name'
          );
          done();
        });
    });

    it('Should not allow a non auth user to add a park', done => {
      request
        .post('/api/v1/parks')
        .send({
          parkname: 'Dzone',
          initialSpots: 5,
          status: 'active',
        })
        .end((error, response) => {
          expect(response.statusCode).to.equal(401);
          expect(response.body).to.be.an('object');
          expect(response.body.errors.title).to.equal('Unauthorized');
          expect(response.body.errors.detail).to.equal(
            'You are not authorized to perform this action'
          );
          done();
        });
    });
  });
  describe('# Edit park', () => {
    it('Should not allow a non auth user edit details of a park', done => {
      request
        .put('/api/v1/parks/2')
        .send({
          parkname: 'The Yard',
          status: 'inactive',
        })
        .end((error, response) => {
          expect(response.statusCode).to.equal(401);
          expect(response.body).to.be.an('object');
          expect(response.body.errors.title).to.equal('Unauthorized');
          expect(response.body.errors.detail).to.equal(
            'You are not authorized to perform this action'
          );
          done();
        });
    });
    it('Should not edit details of a park whose id is not a number', done => {
      request
        .put('/api/v1/parks/:id')
        .set('token', adminToken)
        .send({
          parkname: 'The Yard',
          status: 'inactive',
        })
        .end((error, response) => {
          expect(response.statusCode).to.equal(400);
          expect(response.body).to.be.an('object');
          expect(response.body.errors.id).to.equal(
            'Id must be a number'
          );
          done();
        });
    });
    it('Should allow an auth user to edit the details of a park', done => {
      request
        .put('/api/v1/parks/2')
        .set('token', adminToken)
        .send({
          parkname: 'The Yard',
          status: 'inactive',
        })
        .end((error, response) => {
          expect(response.statusCode).to.equal(200);
          expect(response.body).to.be.an('object');
          expect(response.body.data.park).to.have.property('status');
          expect(response.body.data.park).to.have.property('parkname');

          done();
        });
    });
    it('Should not edit a park that does not exist', done => {
      request
        .put('/api/v1/parks/11')
        .set('token', adminToken)
        .send({
          parkname: 'Crib',
          status: 'inactive',
        })
        .end((error, response) => {
          expect(response.statusCode).to.equal(404);
          expect(response.body).to.be.an('object');
          expect(response.body.errors.title).to.equal('Not Found');
          expect(response.body.errors.detail).to.equal(
            'A park with that Id is not found'
          );

          done();
        });
    });
  });
  describe('# Get all parks', () => {
    it('Should get all parks by user', done => {
      request
        .get('/api/v1/parks')
        .set('token', adminToken)
        .end((error, response) => {
          expect(response.statusCode).to.equal(200);
          expect(response.body).to.be.an('object');
          expect(response.body.data.parks).to.be.an('array');

          done();
        });
    });
  });
  describe('# Get a park', () => {
    it('Should not get a park that does not exist', done => {
      request
        .get('/api/v1/parks/9')
        .set('token', adminToken)
        .end((error, response) => {
          expect(response.statusCode).to.equal(404);
          expect(response.body).to.be.an('object');
          expect(response.body.errors.title).to.equal('Not Found');
          expect(response.body.errors.detail).to.equal(
            "Can't find a park with that id"
          );

          done();
        });
    });
    it('Should get a park', done => {
      request
        .get('/api/v1/parks/1')
        .set('token', adminToken)
        .end((error, response) => {
          expect(response.statusCode).to.equal(200);
          expect(response.body).to.be.an('object');
          expect(response.body.data.park).to.have.property('status');
          expect(response.body.data.park).to.have.property('parkname');
          expect(response.body.data.park).to.have.property('initialSpots');

          done();
        });
    });
    it('Should not get a park whose id is not a number', done => {
      request
        .get('/api/v1/parks/:id')
        .set('token', adminToken)
        .end((error, response) => {
          expect(response.statusCode).to.equal(400);
          expect(response.body).to.be.an('object');
          expect(response.body.errors.id).to.equal(
            'Id must be a number'
          );

          done();
        });
    });
  });
  describe('# Delete a park', () => {
    it('Should not allow a non auth user delete a park', done => {
      request.delete('/api/v1/parks/1').end((error, response) => {
        expect(response.statusCode).to.equal(401);
        expect(response.body).to.be.an('object');
        expect(response.body.errors.title).to.equal('Unauthorized');
        expect(response.body.errors.detail).to.equal(
          'You are not authorized to perform this action'
        );

        done();
      });
    });
    it('Should allow an auth user delete a park', done => {
      request
        .delete('/api/v1/parks/2')
        .set('token', adminToken)
        .end((error, response) => {
          expect(response.statusCode).to.equal(200);
          expect(response.body).to.be.an('object');

          done();
        });
    });
    it('Should not delete a park that does not exist', done => {
      request
        .delete('/api/v1/parks/40')
        .set('token', adminToken)
        .end((error, response) => {
          expect(response.statusCode).to.equal(404);
          expect(response.body).to.be.an('object');
          expect(response.body.errors.title).to.equal('Not Found');
          expect(response.body.errors.detail).to.equal(
            "Can't find a park with that id"
          );

          done();
        });
    });
  });
});
