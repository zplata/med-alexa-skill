const Alexa = require('alexa-sdk');
const appId = require('./alexa-stuff').default;

const handlers = {
  'ConditionsIntent': () => {
    this.response.speak('You have a heart disease.')
      .listen('Did you hear me? You have a heart disease');
    this.emit(':responseReady');
  }
};

exports.handler = function(event, context, callback) {
  const alexa = Alexa.handler(event, context, callback);
  alexa.registerHandlers(handlers);
  alexa.appId = appId;
  alexa.execute();
};
