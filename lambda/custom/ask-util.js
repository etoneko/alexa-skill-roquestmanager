exports.callDirectiveService = (handlerInput, speech) => {
  const { requestEnvelope } = handlerInput;
  const directiveServiceClient = handlerInput.serviceClientFactory.getDirectiveServiceClient();
    
  const directive = {
    header: {
      requestId: requestEnvelope.request.requestId
    },
    directive: {
      type: 'VoicePlayer.Speak',
      speech: speech
    }
  };
  return directiveServiceClient.enqueue(directive, requestEnvelope.context.System.apiEndpoint, requestEnvelope.context.System.apiAccessToken);
};

exports.isSupportsDisplay = (handlerInput) => {
  return handlerInput.requestEnvelope.context &&
        handlerInput.requestEnvelope.context.System &&
          handlerInput.requestEnvelope.context.System.device &&
            handlerInput.requestEnvelope.context.System.device.supportedInterfaces &&
              handlerInput.requestEnvelope.context.System.device.supportedInterfaces.Display;
};

const isResolution = (intentName) => {
  return intentName.resolutions !== undefined 
            && intentName.resolutions.resolutionsPerAuthority !== undefined 
              && intentName.resolutions.resolutionsPerAuthority[0].status.code === 'ER_SUCCESS_MATCH';
};
exports.isResolution = isResolution;

const getResolutionId = (intentName) => {    
  return intentName.resolutions !== undefined 
            && intentName.resolutions.resolutionsPerAuthority !== undefined && isResolution(intentName)
    ? intentName.resolutions.resolutionsPerAuthority[0].values[0].value.id : '';
};
exports.getResolutionId = getResolutionId;

const getResolutionName = (intentName) => {    
  return intentName.resolutions !== undefined 
            && intentName.resolutions.resolutionsPerAuthority !== undefined && isResolution(intentName)
    ? intentName.resolutions.resolutionsPerAuthority[0].values[0].value.name : '';
};
exports.getResolutionName = getResolutionName;

const unitNum2Kanji = (num) => {
  if( typeof num !== 'number' || num <0 || num>=10)
    return num;
  return '零一二三四五六七八九'[num];
};
exports.unitNum2Kanji = unitNum2Kanji;

const convertHidukeYomi = (num) => {
  if( typeof num !== 'number' || num <0 || num>=8)
    return num;
  return ['今日','明日','あさって','三日後','四日後','五日後','六日後','七日後'][num];
};
exports.convertHidukeYomi = convertHidukeYomi;

/*
 *日付の差分日数を返却。
 */
const getDateDiffNum = (today, targetDate) => {
 
  const diff = targetDate.getTime() - today.getTime();
  const tommorow = new Date(today.getFullYear(),today.getMonth(),today.getDate()+1);
  const sub = tommorow.getTime() - today.getTime();

  // +1して返却
  return Math.floor((diff - sub) / (1000 * 60 * 60 *24)) + 1;

};
exports.getDateDiffNum = getDateDiffNum;