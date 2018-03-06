var moment=require('moment');
//var date=

 module.exports.generateMessage=function(from,text){
   var msgObj={};
   msgObj.from=from;
   msgObj.text=text;
   msgObj.createdAt=moment().valueOf();

   return msgObj;
 }
