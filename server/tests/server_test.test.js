const sinon = require('sinon');
const expect = require('expect');
const request = require('supertest');
const _ = require('lodash');
const {ObjectID} = require('mongodb');

const {User} = require('./../models/user');
const {users, populateUsers} = require('./seed/seed');

var app, mongoStore, middle, mongoose;

before((done) => {
  middle = require('./../middleware/authenticate');
  sinon.stub(middle, 'authenticate').returns((req, res, next) => next());
  var server = require('./../server_test');
  mongoStore = server.mongoStore;
  app = server.app;
  mongoose = server.mongoose;
  done();
});
beforeEach((done) => {
  mongoStore.clear((err) => {
    if (err) done(err);
  });

  populateUsers(done);
});
after((done) => {
  mongoose.connection.close()
    .then(() => done())
    .catch((err) => done(err));
});

describe('POST /users', () => {
  it('should create a user', (done) => {
    var email = 'example@example.com';
    var password = '123mnb!';

    request(app)
      .post('/users')
      .send({email, password})
      .expect(200)
      .expect((res) => {
        expect(res.body._id).toExist();
        expect(res.body.email).toBe(email);
      })
      .end((err) => {
        if (err) {
          return done(err);
        }

        User.findOne({email}).then((user) => {
          expect(user).toExist();
          expect(user.password).toNotBe(password);
          done();
        }).catch((e) => done(e));
      });
  });

  it('should return validation errors if request invalid', (done) => {
    request(app)
      .post('/users')
      .send({
        email: 'and',
        password: '123'
      })
      .expect(400)
      .expect((res) => {
        const body = _.pick(res.body, ["errors"]);
        expect(body.errors.email).toExist();
        expect(body.errors.password).toExist();
      })
      .end(done);
  });

  it('should not create user if email in use', (done) => {
    request(app)
      .post('/users')
      .send({
        email: users[0].email,
        password: 'Password123!'
      })
      .expect(400)
      .end(done);
  });
});

describe('GET /profile', () => {
  it('should allow a logged user', (done) => {
    request(app)
      .get('/profile')
      .send()
      .expect(200)
      .end(done);
  });
});

// describe('POST /login', () => {
//   it('should redirect to login on failed login', (done) => {
//     request(app)
//       .post('/login')
//       .send()
//       .expect(302)
//       .expect((res) => {
//         const body = _.pick(res.header, ["location"]);
//         expect(body.location).toBe("/login");
//       })
//       .end(done);
//   });
// });

describe('GET /logout', () => {
  it('should redirect to redirect to home page', (done) => {
    request(app)
      .get('/logout')
      .send()
      .expect(302)
      .expect((res) => {
        const body = _.pick(res.header, ["location"]);
        expect(body.location).toBe("/");
      })
      .end(done);
  });
});