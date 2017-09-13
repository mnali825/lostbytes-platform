var mongoose = require('mongoose');
var passportLocalMongoose = require('passport-local-mongoose');

var InputData = new mongoose.Schema({
  carbohydrates:{type:Number, default:0},
  meats:{type:Number, default:0},
  dairy:{type:Number, default:0},
  veggies:{type:Number, default:0},
  chicken:{type:Number, default:0},
  beef:{type:Number, default:0},
  pork:{type:Number, default:0},
  turkey:{type:Number, default:0},
  moneyLost:{type:Number, default:0}
});

var Session = new mongoose.Schema({
  type:String,
  inputs:[InputData],
  moneyLost:Number,
  moneySaved:Number,
  foodWaste:Number,
  date:{type:Date, default:Date.now()}
});

var User = new mongoose.Schema({
  username:String,
  password:String,
  sessions: [Session],
  totalMoneyLost: {type:Number, default:0},
  totalMoneySaved: {type:Number, default:0},
  totalFoodWaste:{type:Number, default:0}
});

// NOTE: we're using passport-local-mongoose as a plugin
// our schema for user looks pretty thin... but that's because
// the plugin inserts salt, password and username
User.plugin(passportLocalMongoose);
mongoose.model('User', User);
mongoose.model('Session', Session);
mongoose.model('InputData', InputData);
// mongoose.model('Image', Image)


mongoose.connect('mongodb://localhost/lostbytes');
