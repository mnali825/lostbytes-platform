var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var passport = require('passport');
var User = mongoose.model('User');
var Session = mongoose.model('Session');
var InputData = mongoose.model('InputData');
// var Chart = require('chart.js');

router.get('/', function(req, res) {
  res.render('index', { user: req.user });
});

router.get('/login', function(req, res) {
  res.render('login');
});

router.get('/logout', function(req, res){
    req.logout();
    res.redirect('/');
});

router.post('/login', function(req,res,next) {
  // NOTE: use the custom version of authenticate so that we can
  // react to the authentication result... and so that we can
  // propagate an error back to the frontend without using flash
  // messages
  passport.authenticate('local', function(err,user) {
    if(user) {
      // NOTE: using this version of authenticate requires us to
      // call login manually
      req.logIn(user, function(err) {
        res.redirect('/sessions/' + user.username);
      });
    } else {
      res.render('login', {message:'Your login or password is incorrect.'});
    }
  })(req, res, next);
  // NOTE: notice that this form of authenticate returns a function that
  // we call immediately! See custom callback section of docs:
  // http://passportjs.org/guide/authenticate/
});

router.get('/register', function(req, res) {
  res.render('register');
});

router.post('/register', function(req, res) {
  User.register(new User({username:req.body.username}), 
    req.body.password, function(err, user){
    if (err) {
      // NOTE: error? send message back to registration...
      res.render('register',{message:'Your username or password is already taken'});
    } else {
      // NOTE: once you've registered, you should be logged in automatically
      // ...so call authenticate if there's no error
      passport.authenticate('local')(req, res, function() {
        res.redirect('/sessions/' + req.user.username);
      });
    }
  });   
});

//homepage for the webapps
router.get('/sessions/:username', function(req, res) {
  // NOTE: use populate() to retrieve related documents and 
  // embed them.... notice the call to exec, which executes
  // the query:
  // - http://mongoosejs.com/docs/api.html#query_Query-populate
  // - http://mongoosejs.com/docs/api.html#query_Query-exec
  User
    .findOne({username: req.params.username})
    .populate('images').exec(function(err, user) {
    // NOTE: this allows us to conditionally show a form based
    // on whether or not they're on "their page" and if they're
    // logged in:
    //
    // - is req.user populated (yes means they're logged in and we 
    // have a user
    // - is the authenticated user the same as the user that we
    // retireved by looking at the slug?
    
    // var showForm = !!req.user && req.user.username == user.username;
    
    if (req.user) {
      res.render('user', { 
        username: user.username,
        sessions: user.sessions.reverse()
      });
    } else {
      res.redirect('/login');
    }
  });
});

//create a new session and save it in db
router.post('/api/startSession', function(req, res) {
  var session = new Session({
    type:req.body.session,
    moneyLost:0,
    moneySaved:0,
    foodWaste:0
  }).save(function(err, sess){
    console.log(err, sess);
    res.set('id', sess._id);
    res.status(200).send(req.body);
  });
});


//add new input to current session
router.post('/api/postData/:id', function(req, res) {
  var input = new InputData({
   carbohydrates:req.body.carbohydrates,
   meats:req.body.meats,
   dairy:req.body.dairy,
   veggies:req.body.veggies,
   chicken:req.body.chicken,
   beef:req.body.beef,
   pork:req.body.pork,
   turkey:req.body.turkey,
   moneyLost:req.body.moneyLost
  });

  Session.findOne({_id:req.params.id}, function(err, sess) {
    console.log('this is the session we are adding inputs to: ', sess);
    console.log('this is the input we want to push ', input);
    sess.inputs.push(input);
    sess.save(function(err, sess) {
      console.log('saved '+sess);
      console.log('this is the id we are looking for: ', input._id);
      res.set('id', input._id);
      res.send(req.body);
    });
  });
});

//ajax request of a current sessions input values
//instead of this, add an edit button to the list of recent data entries
//clicking on edit button will pop up modal to edit the values of the input
// router.get('/api/session-inputs/:id', function(req, res) {
//   Session.findOne({_id:req.params.id}, function(err, sess) {
//     res.json(sess.inputs.map(function(ele) {
//       // if (ele.veggies !== 0) {
//       //   return "data":{"veggies":ele.veggies}
//       // } else if (ele.meats !== 0) {
//       //   return "data":{"meats":ele.meats}
//       // }
//       return {
//         "id":ele._id,
//         "veggies":ele.veggies,
//         "meats":ele.meats,
//         "dairy":ele.dairy,
//         "carbohydrates":ele.carbohydrates
//       }
//     }));
//   });
// });


//use ajax to fetch all sessions in json format
//TODO:
//Create ajax request?
//could just create a new page where user can see all session and update them
//more about data than about editing session information
router.get('/api/sessions', function(req,res) {
  console.log('getting user and returning sessions');
  User.findOne({username:req.user.username}, function(err, user) {
    res.json(user.sessions.map(function(sess) {
      return {
        "type":sess.type,
        "moneyLost":sess.moneyLost,
        "moneySaved":sess.moneySaved,
        "foodWaste":sess.foodWaste,
        "data":sess.date,
        "inputs":sess.inputs
      }
    }));
  })
  // Session.find('', function(err, sess) {
  //   res.json(sess.map(function(ele) {
  //     return {
  //       "type":sess.type,
  //       "moneyLost":sess.moneyLost,
  //       "moneySaved":sess.moneySaved,
  //       "foodWaste":sess.foodWaste,
  //       "data":sess.date,
  //       "inputs":sess.inputs
  //     }
  //   }));
  // });
});

//finish a session and add it to user
router.post('/api/finishSession/:id', function(req, res) {
  console.log('starting finish session algo');
  Session.findOne({_id:req.params.id}, function(err, sess) {
    console.log('found session and updating');
    sess.moneyLost = req.body.moneyLost;
    sess.foodWaste = req.body.foodWaste;
    sess.save(function(err, sess) {
      console.log('saved: ', sess);
      User.findOne({username:req.user.username}, function(err, user) {
        user.sessions.push(sess);
        user.totalMoneyLost += sess.moneyLost;
        user.totalMoneySaved += sess.moneySaved;
        user.totalFoodWaste += sess.foodWaste;
        user.save(function(err,user) {
          console.log('saved session into user: ', user);
        });
      });
    });
  });
});

module.exports = router;
