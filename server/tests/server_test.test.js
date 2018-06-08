const expect = require('expect');
const request = require('supertest');
const {ObjectID} = require('mongodb');

const {app} = require('./../server_test');
const {Todo} = require('./../models/todo');
const {User} = require('./../models/user');
const {users, populateUsers} = require('./seed/seed');

beforeEach(populateUsers);

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

  // it('should return validation errors if request invalid', (done) => {
  //   request(app)
  //     .post('/users')
  //     .send({
  //       email: 'and',
  //       password: '123'
  //     })
  //     .expect(400)
  //     .end(done);
  // });

  // it('should not create user if email in use', (done) => {
  //   request(app)
  //     .post('/users')
  //     .send({
  //       email: users[0].email,
  //       password: 'Password123!'
  //     })
  //     .expect(400)
  //     .end(done);
  // });
});