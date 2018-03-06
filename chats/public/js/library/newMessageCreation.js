function newMessageCreation(typeofData,message){

  var setTime=moment(message.createdAt).format('lll');
  var outerdiv=$('<div></div>');  //creating an element
  outerdiv.addClass('col-xs-12 col-sm-12 col-lg-12 ');
  var innerdiv=$('<div></div>');
  innerdiv.addClass('col-check');

  innerdiv.attr('style',"background-color:#e5fff9");
  innerdiv.html('<h5></h5>');
  var paramVal=jQuery.deparam(window.location.search);

  var user1=paramVal.name;
  var user2=paramVal.otherUser;

  if(message.from=='Admin'){
   innerdiv.addClass('col-centered well');
  }

  else if(message.from!=user1){
    console.log('here1');
      innerdiv.addClass('pull-right well');
  }
  else if(message.from==user1){
    innerdiv.addClass('pull-left well');
   }


  switch (typeofData) {
   case 'textMsg':
         innerdiv.html('<b>'+message.from+'</b>'+'<h5></h5>'+'<b>Msg :</b>'+message.text+ '<h5 class="text-right">'+setTime+'</h5>');
         break;
   case 'imageMsg':
         innerdiv.html('<b>'+message.from+'</b>'+'<h5></h5>'+'<img style="width:220px;height:200px" src="' + message.text + '"/>'+ '<h5 class="text-right">'+setTime+'</h5>');
         break;
   case 'videoMsg':
         innerdiv.html('<b>'+message.from+'</b>'+'<h5></h5>'+
         '<video width =320 height=240 controls src="' + message.text + '" +type="video/mp4"/>'+
         '<h5 class="text-right">'+setTime+'</h5>');
         break;
   case 'locaionMsg':
         innerdiv.html('<b>'+message.from+'</b>'+'<h5></h5>'+
         '<img style="width:400px;height:300px" src="' + message.link + '"/>'+
         '<h5 class="text-right">'+setTime+'</h5>');
         break;
   default:
      alert('no media matching');
  }
  outerdiv.html(innerdiv);

  $('#messages').append(outerdiv);
  console.log(message);
  scrollToBottom();
}
