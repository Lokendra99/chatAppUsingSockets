var moment=require('moment');

module.exports.locationGenerateMessage=function(from,link){
  var msgObj={};
  msgObj.from=from;
  msgObj.link=link;
  msgObj.createdAt=moment().valueOf();

  return msgObj;
};
