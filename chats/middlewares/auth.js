var mongoose=require('mongoose');

var chatUserModel=mongoose.model('chatUserModel');


module.exports.settingAuthPerms=function(req,res,next){
  if(!req.session.user){
    res.redirect('/loginPage');
  }
  else{
    next();
  }
}
