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

const conSpeechDayAfter = (num) => {
  if( typeof num !== 'number' || num <0 || num>=10)
    return num;
  return ['今日','明日','あさって','三日後','四日後','五日後','六日後','七日後','八日後','九日後'][num];
};
exports.conSpeechDayAfter = conSpeechDayAfter;

const conSpeechHourHH12 = date => {
  const hour = date.getHours();
  const minute = date.getMinutes();

  let output = '';
  if(hour === 12 && minute === 0) {
    output += '正午';
  } else if (hour <12) {
    output += '午前' + hour + '時';
  } else {
    output += '午後' + (hour-12) + '時';
  }
  return output;
};
exports.conSpeechHourHH12 = conSpeechHourHH12;

const conSpeechMinute = date => {
  return date.getMinutes() + '分';
};
exports.conSpeechMinute = conSpeechMinute;

const conSpeechTimeHH12 = date => {
  return date.getMinutes() ===0 ? 
    conSpeechHourHH12(date) : conSpeechHourHH12(date) + conSpeechMinute(date);
};
exports.conSpeechTimeHH12 = conSpeechTimeHH12;

/*
 *日付の差分日数を返却。
 */
const getDateDiffNum = (today, targetDate) => {
 
  const today2 = new Date(today.getFullYear(),today.getMonth(),today.getDate());
  const targetDay = new Date(targetDate.getFullYear(),targetDate.getMonth(),targetDate.getDate());
  const diff = targetDay.getTime() - today2.getTime();
  // +1して返却
  return Math.floor(diff / (1000 * 60 * 60 *24));

};
exports.getDateDiffNum = getDateDiffNum;

