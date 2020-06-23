'use strict'

const AWS = require('aws-sdk');
AWS.config.update({ region: "us-east-2" });

exports.handler = async(event, context) => {
    //Get App Level AT
    var payload = {
        appId: event.appId,
        appSecret: event.appSecret
    };
    var accessToken;
    try {
        accessToken = await getAppLevelAccessToken(payload);
    }
    catch (err) {
        context.fail(err);
    }
    
    var options=getOptions(accessToken,event.appId,event.type);
    var body = getRequestObject(event.openId);
    console.log(JSON.stringify(body));
    try {
        const result = await doPostRequest(options, JSON.stringify(body));
        console.log(result);
        return result;
    }
    catch (e) {
        console.log(e);
        context.fail(e);
    }
    //Send the response o the excecution
    const response = {
        statusCode: 200,
        body: JSON.stringify('Hello from Lambda!'),
    };
    return response;
};

function getOptions(accessToken,appId,type){
    //Send the obj as an Account Binding Result Notification
    const auth = "Bearer " + encodeURI(accessToken);
    const options = {
        hostname: 'hag-sg.cloud.huawei.com',
        path: '/open-ability/v1/open-account-events/'+type,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'x-appid': appId,
            'Authorization': auth
        }
    };
    console.log(options);
    return options;
}



function getRequestObject(openId) {
    const time = new Date(new Date().toUTCString());
    const utc = time.YYYYMMDDHHMMSS();
    var obj = {
        "requestTime": utc,
        "openId": openId
    };
    return obj;
}

Date.prototype.YYYYMMDDHHMMSS = function() {
    var yyyy = this.getFullYear().toString();
    var MM = pad(this.getMonth() + 1, 2);
    var dd = pad(this.getDate(), 2);
    var hh = pad(this.getHours(), 2);
    var mm = pad(this.getMinutes(), 2);
    var ss = pad(this.getSeconds(), 2);
    var sss = pad(this.getMilliseconds(), 3);

    return yyyy + MM + dd + hh + mm + ss + sss;
};

function pad(number, length) {

    var str = '' + number;
    while (str.length < length) {
        str = '0' + str;
    }

    return str;

}



const getAppLevelAccessToken = (payload) => {
    var params = {
        FunctionName: 'GetAccessToken', // the lambda function we are going to invoke
        InvocationType: 'RequestResponse',
        LogType: 'Tail',
        Payload: JSON.stringify(payload)
    };
    return new Promise((resolve, reject) => {
        //Get App Level Access Token
        var lambda = new AWS.Lambda();
        lambda.invoke(params, function(err, data) {
            if (err) {
                reject(err);
            }
            else {
                const payload = JSON.parse(data.Payload);
                console.log(data.Payload)
                resolve(payload.access_token);
            }
        });
    });
};


const doPostRequest = (options, body) => {
    const https = require("https");
    return new Promise((resolve, reject) => {
        //create the request object with the callback with the result
        const req = https.request(options, function(res) {
            res.setEncoding('utf8');
            console.log(res.statusCode);
            res.on('data', function(chunk) {
                console.log('Response: ' + chunk);
                resolve(chunk);

            });
            res.on('error', function(e) {
                console.log(e.message);
                reject(e.message);
            });

        });
        //do the request
        if(body){
            req.write(body);
        }

        //finish the request
        req.end();
    });
};
