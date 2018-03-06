var express=require('express');
var mongoose=require('mongoose');
var objGenerator=require('../../library/generator');
var auth=require('../../middlewares/auth');
var user=require('../models/Users');
var moment=require('moment');
var events=require('events');
var socketIO=require('socket.io');
var msg=require('../../library/messageGenerator.js');
var locationMsg=require('../../library/locationMsgGenerator.js');

var chatUserModel=mongoose.model('chatUserModel');
var ChatHistory=mongoose.model('ChatHistory');
var eventEmitter =new events.EventEmitter();

module.exports.controller=function(app,server){

  var arrayOfOnlineUsersById=[];
  var arrayOfOnlineUsersByName=[];
  var arrayofPersonalChat=[];
  var tempToStoreRoomName=null;
  var flag=1;
  var friendsList=[];

  var io=socketIO(server);
  io.on('connection',function(socket){
    socket.on('onLoginPassngUserName',function(dataofUser){
      arrayOfOnlineUsersById.push(socket.id);
      arrayOfOnlineUsersByName.push(dataofUser.user);
    });

    function fromWhomToWho(userName){
      var checkUser={};
      for(var i in arrayOfOnlineUsersByName){
        if(arrayOfOnlineUsersByName[i]==userName){
           checkUser.from=arrayOfOnlineUsersByName[i];
        }
        else{
          checkUser.to =arrayOfOnlineUsersByName[i];
        }
      }
      return checkUser;
    }

    socket.on('join',function(paramsData,callback){
      socket.username=paramsData.user;
      console.log('socket.username '+socket.username);
      tempToStoreRoomName=paramsData.room;

      if(!arrayofPersonalChat[tempToStoreRoomName]){
        arrayofPersonalChat[tempToStoreRoomName]=1;
      }
      else{
        arrayofPersonalChat[tempToStoreRoomName]++;
      }

      var roomname=paramsData.room;
      var userName=paramsData.user;
      var choice=paramsData.choice;

      var messageConcat=userName+'Joined the room';
      var messageToLeave=userName+'left the room';

      if(arrayofPersonalChat[tempToStoreRoomName]<3){  // to make sure that in a personal only 2
                                                      //users are present in that particular room.

        socket.join(roomname);
        socket.roomName=roomname;
        console.log('socket.roomName '+socket.roomName);

        socket.on('userTypingStarted',function(typingStatus){
          socket.broadcast.to(roomname).emit('newMessage',msg.generateMessage(userName,typingStatus));
        });

        socket.emit('newMessage',msg.generateMessage('Admin','Welcome to Our Chat App'));
        socket.broadcast.to(roomname).emit('newMessage',msg.generateMessage('Admin',messageConcat));

        socket.on('createMessage',function(messageRecievedFromClientSide,callback){

          eventEmitter.emit('saveMessageFromSenderSide',{
            from:fromWhomToWho(userName).from,
            to:fromWhomToWho(userName).to,
            text:messageRecievedFromClientSide.text,
            room:roomname,
            createdAt:moment().valueOf()
          });
          io.in(roomname).emit('newMessage',  msg.generateMessage( userName,messageRecievedFromClientSide.text));
          callback('yes the data has been acknowledged by the server');
        });

        socket.on('locationMessage',function(locationMessageVal,callback){

          var latlon=locationMessageVal.latitude.toString()+ ','+ locationMessageVal.longitude.toString();
          var mapLink="https://maps.googleapis.com/maps/api/staticmap?center="  +latlon+"&zoom=12&markers="+latlon+"|"+latlon +"&path=color:0x0000FF80|weight:5|25.3176452,82.97391440000001   &size=400x300&key=AIzaSyBbGfzQUmeWCAz0_uibCatfxt951immY1o";

          eventEmitter.emit('saveMessageFromSenderSide',{   //emitting an event to save the message
            from:fromWhomToWho(userName).from,
            to:fromWhomToWho(userName).to,
            text:latlon,
            room:roomname,
            createdAt:moment().valueOf()
          });
          io.in(roomname).emit('newLocationMessage',locationMsg.locationGenerateMessage(locationMessageVal.userSendingLocation,mapLink));
          callback('user location has been recieved by server');
        });

        socket.on('user image', function (imageData) {

          eventEmitter.emit('saveMessageFromSenderSide',{     //emitting an event to save the image
            from:fromWhomToWho(userName).from,
            to:fromWhomToWho(userName).to,
            text:imageData.imageToBase64,
            room:roomname,
            createdAt:moment().valueOf()
          });
        io.in(roomname).emit('ImageToBeDisplayed',
         msg.generateMessage(imageData.userSendingImg,imageData.imageToBase64));
        });

        socket.on('user video', function (videoData) {

          eventEmitter.emit('saveMessageFromSenderSide',{    //emitting an event to save the video
            from:fromWhomToWho(userName).from,
            to:fromWhomToWho(userName).to,
            text:videoData.videoToBase64,
            room:roomname,
            createdAt:moment().valueOf()
          });
        io.in(roomname).emit('videoToBeDisplayed',
         msg.generateMessage(videoData.userSendingVideo,videoData.videoToBase64));
        });
      }

      socket.on('leaveRoom',function(userLeavingMessage){
        socket.broadcast.to(roomname).emit('newMessage',msg.generateMessage('Admin',userLeavingMessage));
        socket.leave('room');
        if(flag){
          flag=0;
          arrayofPersonalChat[tempToStoreRoomName]--;
        }
      });
      callback(arrayofPersonalChat[tempToStoreRoomName]);
    });

    socket.on('disconnect',function(){
      console.log('socket.username disconnect '+socket.username);
        console.log('socket.roomName disconnect '+socket.roomName);
      var concatMsgToLeave=socket.username+'left the chat';
      io.in(socket.roomName).emit('newMessage',msg.generateMessage('Admin',
      concatMsgToLeave));

      if(flag){
          arrayofPersonalChat[tempToStoreRoomName]--;
      }
    });
  });

  eventEmitter.on('saveMessageFromSenderSide',function(data){ //listening an event to save the message
    newMessageObj= new ChatHistory({
      from:data.from,
      to:data.to,
      text:data.text,
      room:data.room,
      createdAt:data.createdAt
    });

    var fromUser=newMessageObj.from;
    var toUser=newMessageObj.to;
    var count =0;
    var coun1=0;
    var count2=0;
    var count3=0;


    chatUserModel.findOne({'fullName':fromUser},function(error,responsefrom){
      if(responsefrom.friendsList.length==0){
        count2++;
        responsefrom.friendsList.push(toUser);
      }
      else{
        var x=responsefrom.friendsList;
        for(var i=0;i<x.length;i++){
          if(toUser!=x[i] &&toUser!=responsefrom.fullName){
            count3++;
            x.push(toUser);
          }
        }
      }
      responsefrom.chat.push(newMessageObj);
      responsefrom.save(function(error2,finalData){
        if(error2){res.send(objGenerator.generatorFn(true,"there is error while saving chat",404,null));}
        else{
        }
      });
    });

    chatUserModel.findOne({'fullName':toUser},function(error,responseTo){
      if(responseTo.friendsList.length==0){
        count++;
        responseTo.friendsList.push(fromUser);

      }
      else{
        var y=responseTo.friendsList;
        for(var i=0;i<y.length;i++){
          if(toUser!=y[i] && toUser!=responseTo.fullName){
            count1++;

            y.push(toUser);
            console.log('count1 '+count1);
          }
        }
      }

      responseTo.chat.push(newMessageObj);

      responseTo.save(function(error2,finalData){
        if(error2){res.send(objGenerator.generatorFn(true,"there is error while saving chat",404,null));}
        else{
        }
      });
    });
  });

};
