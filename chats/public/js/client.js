$(document).ready(function() {
  var socket=io();
   var params={user:user,room:room,choice:choice};

   var typing = false;
   var idle = 0;
   var sendBtnClicked=false;

   //to get the user who is sending message from client side
   function getUserNameSendingMsg(){
     var paramVal=jQuery.deparam(window.location.search);
     var user1=paramVal.name;
     return user1;
   }
   //to read toReadMedia
   function toReadMedia(e){
     var data = e.originalEvent.target.files[0];
     var reader = new FileReader();
     reader.readAsDataURL(data);
     return reader;
   }

  socket.on('connect',function(){

    socket.emit('onLoginPassngUserName',params);
    socket.emit('join',params,function(size){
      if(size>2){
        alert('sorry its a personal chat and the room '+params.room +' is already filled with 2 people');
        window.location.href='/loginPage';
      }
      else{
        console.log('no error');
      }
    });
// function to check whther user is typing or not
    $("#input_val").keypress(function() {
      idle = 0;
      if (typing == false) {
        typing = true;
        socket.emit('userTypingStarted','User is typing');
      }
    });
    $("#sendbtn").click(function(){
      typing = false;
    });
    $("#input_val").keypress(function(e){
      if(e.which==13) typing = false;
    });
    function timeIdle(){
      idle++;
      if (idle >= 2) typing = false;
    }
    setInterval(timeIdle, 6000);
  });

  var msgToBeSendWhileLeavingChat=user+' left the chat';

  $('#leaveChatBtn').on('click',function(){
    socket.emit('leaveRoom',msgToBeSendWhileLeavingChat);
  });

  socket.on('disconnect',function(){
    console.log('user being disconnected from client side');
  });

  socket.on('newMessage',function(message){
    newMessageCreation('textMsg',message);
  });

  socket.on('ImageToBeDisplayed', function(message){
    newMessageCreation('imageMsg',message);
  });

  socket.on('videoToBeDisplayed', function(message){
    newMessageCreation('videoMsg',message);
  });

  socket.on('newLocationMessage',function(message){
    newMessageCreation('locaionMsg',message);
  });

  $('#formId').on('submit',function(e){
    e.preventDefault();

    if($('#sendbtn').click()){

    if($('#input_val').val()){

        socket.emit('createMessage',{
          text:$('[name=inputName]').val()
        },function(acknowledgement){
          console.log(acknowledgement);
        })
    }
  }
    else{
      alert('You cant send empty message');
    }
    $('#input_val').val('');
  });
// logic to send image
  $('#imagefile').bind('change', function(e){
        toReadMedia(e).onload = function(evt){
          socket.emit('user image', {
            imageToBase64:evt.target.result,
            userSendingImg:getUserNameSendingMsg()
          });
        };
  });
// logic to send video
  $('#videofile').bind('change', function(e){
        toReadMedia(e).onload = function(evt){
          socket.emit('user video', {
            videoToBase64:evt.target.result,
            userSendingVideo:getUserNameSendingMsg()
          });
        };
  });

// function to get location of a user
  var locationbtn=$('#locationBtnId');

  locationbtn.on('click',function(){

    if(!navigator.geolocation){alert('Your browser does not support navigation');}
    $('#divcheck').attr('style','display:block');
    navigator.geolocation.getCurrentPosition(
      function(position){
        $('#divcheck').attr('style','display:none');
        socket.emit('locationMessage',{
          latitude:position.coords.latitude,
          longitude:position.coords.longitude,
          userSendingLocation:getUserNameSendingMsg()
        },function(acknowledgement){console.log('server acknowledgement'+acknowledgement);});
        console.log(position);
      },
      function(){alert('Location could not be detected right now.');locationbtn.removeAttr('disabled');});
    });
});
