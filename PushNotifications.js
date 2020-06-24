'use strict'

const AWS = require('aws-sdk');
AWS.config.update({ region: "us-east-2" });

exports.handler = async(event) => {
    // TODO implement

    var payload = {
        appId: event.appId,
        appSecret: event.appSecret
    };
    var accessToken;
    try {
        accessToken = await getAppLevelAccessToken(payload);
    }
    catch (err) {
        console.log(err);
    }

    var options = getPushOptions(event.appId, accessToken);
    const logoUrl = "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1c/DC_Comics_logo.png/600px-DC_Comics_logo.png";
    const data = {
        param1: "String Parameter",
        param2: 20,
        param3: {
            param31: "Hello",
            param32: "world4"
        }
    };

    var body = buildNotification("Hello", "Notification from AWS", logoUrl, data, event.token);
    console.log(JSON.stringify(options));
    console.log(JSON.stringify(body));
    try {
        const response = await doPostRequest(options, JSON.stringify(body));
        console.log(response);

    }
    catch (e) {
        console.log(e);
    }


    const response = {
        statusCode: 200,
        body: JSON.stringify('Hello from Lambda!'),
    };
    return response;
};

function buildNotification(title, message, imgUrl, data, token) {
    // body...
    var body = {
        message: {
            android: {
                notification: {
                    title: title,
                    body: message,
                    click_action:{
                        type:1,
                        intent:"https://dummyapp.com/target?param1=hello&param2=world",
                        action:"ACTION_VIEW"
                    }
                }
                
            }
        }
    };
    if (imgUrl) {
        body.message.android.notification.image = imgUrl;
    }

    if (data) {
        body.message.android.data = JSON.stringify(data);
    }
    if (token) {
        body.message.token = token;
    }

    return body;
}



function getPushOptions(appId, accessToken) {
    //Send the obj as an Account Binding Result Notification
    const auth = "Bearer " + encodeURI(accessToken);
    const options = {
        hostname: 'push-api.cloud.huawei.com',
        path: '/v1/' + appId + '/messages:send',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': auth
        }
    };
    console.log(options);
    return options;
}

//https://push-api.cloud.huawei.com/v1/[appid]/messages:send

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
        if (body) {
            req.write(body);
        }

        //finish the request
        req.end();
    });
};




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
