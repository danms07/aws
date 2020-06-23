const https=require("https")
exports.handler = async(event,context) => {
    // TODO implement
    
    const grant_type = encodeURI("client_credentials");
    var client_id;
    
    if(event.hasOwnProperty('appId')){
      client_id=encodeURI(event.appId);
    }
    else{
      client_id=encodeURI(process.env.appId);
    }
    
    var client_secret;
    if(event.hasOwnProperty('appSecret')){
      client_secret=encodeURI(event.appSecret);
    }
    else{
      client_secret=encodeURI(process.env.appSecret);
    }

    const data = "grant_type=" + grant_type + "&client_id=" + client_id + "&client_secret=" + client_secret;
    console.log(data);
  
    try{
      const result= await getAccessToken(data);
      console.log(result);
      const json=JSON.parse(result);
      return json;
    }catch(error){
      context.fail(error);
    }
};
const getAccessToken = (data) => {
//	https://login.cloud.huawei.com/oauth2/v2/token

  return new Promise((resolve, reject) => {
    const options = {
        hostname:'login.cloud.huawei.com',
        path: '/oauth2/v2/token',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    };

    //create the request object with the callback with the result
    const req =https.request(options, function(res) {
      res.setEncoding('utf8');
      res.on('data', function (chunk) {
          resolve(chunk);
          
      });
      res.on('error', function (e) {
        reject(e.message);
      });

  });
    //do the request
    req.write(data);

    //finish the request
    req.end();
  });
};
