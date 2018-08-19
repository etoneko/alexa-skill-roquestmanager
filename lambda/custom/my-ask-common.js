/* eslint-disable  no-console */

const DebugRequestInterceptor = {
  process(handlerInput) {
    return new Promise((resolve) => {
      console.log('request interseptor called');
      console.log(JSON.stringify(handlerInput));
      resolve(); 
    });
  }
};
exports.DebugRequestInterceptor = DebugRequestInterceptor;
const DebugResponseInterceptor = {
  process(handlerInput) {
    return new Promise((resolve) => {
      console.log('response interseptor called');
      console.log(JSON.stringify(handlerInput));
      resolve(); 
    });
  }
};
exports.DebugResponseInterceptor = DebugResponseInterceptor;

const FatalErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log('FaitalError called');
    console.log(JSON.stringify(handlerInput));
    console.log(error.message);
    console.log(error.stack);
    return handlerInput.responseBuilder
      .speak('ごめんなさい。エラーが発生しました。スキルを終了します。')
      .getResponse();
  }
};
exports.FatalErrorHandler = FatalErrorHandler;

const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    handlerInput.attributesManager.setPersistentAttributes(attributes.persistent);
    handlerInput.attributesManager.savePersistentAttributes();

    return handlerInput.responseBuilder.getResponse();
  },
};
exports.SessionEndedRequestHandler = SessionEndedRequestHandler;

