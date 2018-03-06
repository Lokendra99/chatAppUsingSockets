var mongoose=require('mongoose');

var Schema=mongoose.Schema;

var ChatHistory=new Schema({
  'from'                : {type:'String',default:''},
  'to'                  : {type:'String',default:''},
  'text'                : {type:'String',default:''},
  'room'                :{type:'String', default:''},
  'createdAt'           : {type:Date}
});

mongoose.model('ChatHistory',ChatHistory);


var chatUser=new Schema({
  'firstName'           : {type:'String',default:''},
  'lastName'            : {type:'String',default:''},
  'fullName'            : {type:'String',default:'',unique:true},
  'email'               : {type:'String',default:'',unique:true},
  'chat'                : [ChatHistory],
  'friendsList'         : [],
  'password'            : {type:'String',default:''},
});


mongoose.model('chatUserModel',chatUser);
