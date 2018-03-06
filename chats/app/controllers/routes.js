var express=require('express');
var mongoose=require('mongoose');
var route=express.Router();
var nodemailer=require('nodemailer');

var objGenerator=require('../../library/generator');
var auth=require('../../middlewares/auth');

var user=require('../models/Users');
var chatUserModel=mongoose.model('chatUserModel');

module.exports.controller=function(app,server){

  route.get('/signUpPage',function(req,res){
    res.render('signUp',{})
  });

  route.post('/signUpInfo',function(req,res){

    req.checkBody('firstName','firstName is required').notEmpty();
    req.checkBody('lastName','lastName is required').notEmpty();
    req.checkBody('email','email is required').notEmpty();
    req.checkBody('password','password is required').notEmpty();


    var validationErrors=req.validationErrors();
    if(validationErrors){
      res.render('signUp',{validationErrors:validationErrors})
    }
    else{
      var temp=req.body.email;
      var savingIndex=null;
      for(var i=0;i<temp.length;i++){
        if(temp[i]=='.'){
          savingIndex=i;
        }
      }
      var resultantString=temp.slice(0,savingIndex);

        if(req.body.firstName!=undefined && req.body.lastName!=undefined
         &&req.body.email!=undefined && req.body.password!=undefined){

          var newChatUser= new chatUserModel({
            'firstName':req.body.firstName,
            'lastName':req.body.lastName,
            'fullName':req.body.firstName+req.body.lastName+resultantString,
            'email':req.body.email,
            'password':req.body.password
          });
        }

        newChatUser.save(function(err,result){
          if(err){
            res.send(objGenerator.generatorFn(true,"User with this email id already exists",404,null));
          }
          else{
            req.session.user=newChatUser;
            delete req.session.user.password;
            req.flash('success','Signup successfull');
            var permanent_user=result.fullName;
            res.render('choiceSelectionBetweenSingleVsGroupChat',{permanent_user:permanent_user});
          }
        });
    }
  });
  route.get('/loginPage',function(req,res){
    res.render('login',{});
  });

  route.post('/loginCheck',function(req,res){
    req.checkBody('email','email is required').notEmpty();
    req.checkBody('password','password is required').notEmpty();

    var validationErrors=req.validationErrors();
    if(validationErrors){
      res.render('login',{validationErrors:validationErrors});
    } else{
      chatUserModel.findOne({$and:[{"email":req.body.email},{"password":req.body.password}]},
      function(err,result){
        if(err){
          res.send(objGenerator.generatorFn(true,"no user with given id",404,null));
        }
        else if(result==null || result==undefined){
          res.send(objGenerator.generatorFn(true,"user not available",404,null));
        }
        else{
          req.flash('success','login successfull');
          req.session.user=result;

          delete req.session.user.password;
          var permanent_user=result.fullName;
          res.render('choiceSelectionBetweenSingleVsGroupChat',{permanent_user:permanent_user});
        }
      });
    }
  });

// main page route to get user fill up the single chat form
  route.get('/main',auth.settingAuthPerms,function(req,res){
    var choice=req.query.choice;
    var permanent_user=req.query.permanent_user;
    res.render('main',{userName:permanent_user,choice:choice});
  });

//once the choice is made ,this following route creates a socket.io connection
  route.get('/chat/:choice',auth.settingAuthPerms,function(req,res){
    var user=req.query.name;
    var room=req.query.room;
    var choice=req.params.choice;
    var user1=req.query.name;
    var user2=req.query.otherUser;
    var PersonalChatHistory=[];

    if(user2!=undefined){
      chatUserModel.findOne({"fullName":user1},function(err,result){
        var shrtHandCheck=result.chat
        for(var i in shrtHandCheck ){
          if(shrtHandCheck[i].from==user2 ||shrtHandCheck[i].to==user2){
            PersonalChatHistory.push(shrtHandCheck[i]);
          }
        }
        res.render('index',{
          user:user,
          room:room,
          choice:choice,
          PersonalChatHistory:PersonalChatHistory,
          user1:user
        })
      });
    }
    else{
      res.render('index',{
        user:user,
        room:room,
        choice:choice,
        PersonalChatHistory:PersonalChatHistory
      })
    }
  });

// this is to get previous chat history of a user
  route.get('/chatHistoryOfIndividual/:userName',auth.settingAuthPerms,function(req,res){
    chatUserModel.findOne({"fullName":req.params.userName},function(err,result){
      res.render('previousChats',{friendsList:result.friendsList,hisName:result.fullName});
    });
  });

  var roomArray=[];
  var flag1=0;
  var flag2=0;
  var flag3=0;
  var finalRoomValue=null;


  route.get('/previousChatsHistory/:user2/:user1',auth.settingAuthPerms,function(req,res){
    var user1=req.params.user1;
    var user2=req.params.user2;
    if(roomArray.length==0){
      room1=user1+user2;
      console.log('room1 '+room1);
      roomArray.push(room1);
      finalRoomValue=room1;
    }else{
       room2=user2+user1;
       room1=user1+user2;
       console.log('room2 '+room2);
      for(var i =0;i<roomArray.length;i++){
        if(room2===roomArray[i]){
          console.log('satisfying here '+'room2 '+room2+'roomArray[i] '+roomArray[i]);
          flag1=1;
          flag2=0;
          break;
        }
        else if(room1==roomArray[i]){
          flag3=1;
          flag1=0;
          flag2=0;
          break;
        }
        else{
          flag2=1;
          flag1=0;
          flag3=0;
        }
      }
    }
    if(flag1==1 && flag3==0 &&flag2==0){
      console.log('flag1 '+room1);
      finalRoomValue=room2;
      console.log('finalRoomValue '+finalRoomValue);
    }
    else if(flag1==0 && flag3==1&&flag2==0){
      finalRoomValue=room1;
    }
    else if(flag2==1 && flag1==0 && flag3==0){
      console.log('flag1 flag2 '+room2);

      roomArray.push(room2);
      finalRoomValue=room2;
      console.log('finalRoomValue '+finalRoomValue);

    }
    var urlToBeRedirected='/chat/singleChat?name='+user1+'&room='+finalRoomValue+
    '&otherUser='+user2;
    res.redirect(urlToBeRedirected);
  });

  //reset password

  route.get('/passwordReset',function(req,res){
    res.render('resettingPassword',{})
  })

  // Send Email
  route.post('/send', function(req, res, next){
      var transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
          user: 'chatapp390@gmail.com',
          pass: 'lokendra99'
        }
      });

      var mailOptions = {
        from: '"chatApp" <chatapp390@gmail.com>',
        to: req.body.email,
        subject: 'Hello from chatApp',
        text: 'As you have requested for password reset.Kindly click this link '+'http://localhost:4000/password-reset/'+req.body.email

      }

      transporter.sendMail(mailOptions, function(error, info){
        if(error){
        res.send(objGenerator.generatorFn(true,"there is Error whlile sending the message to your id",404,null));
        }
        else{
          console.log('Message Sent: '+ info.response);
          res.send(objGenerator.generatorFn(false,'Successfully Sent mail to your id',200,'Details could not be disclosed'));
        }

      });

  });

  route.get('/password-reset/:email',function(req,res){
    res.render('passwordRestTemplate',{email:req.params.email})
  })

  route.post('/updatePasswordInDatabase/:email',function(req,res){

    req.checkBody('password','password is required').notEmpty();

    var validationErrors=req.validationErrors();
    if(validationErrors){
      res.render('passwordRestTemplate',{email:req.params.email,validationErrors:validationErrors})
    }
    else{
      var update=req.body;
      chatUserModel.findOneAndUpdate({'email':req.params.email},update,function(err,response){
        if(err){res.send(objGenerator.generatorFn(true,"there is no user with th given id",404,null));}
        else{
          //req.flash('success','password updated');
          res.redirect('/loginPage');
        }
      })
    }
  })
  app.use('/',route);
}
