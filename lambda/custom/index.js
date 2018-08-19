process.env.TZ = 'Asia/Tokyo';
const Alexa = require('ask-sdk');
const Util = require('./ask-util');
const ROQM = require('./ROQuestManager');
const MyAskCommon = require('./my-ask-common');
const QuestDataList = require('./data/quest.json');
const HELP_MESSAGE = '<p>r oのクエストを管理します。クエストを完了にすると次回起動時に再受注が可能になったクエストをアナウンスします。'
+ 'クエストが完了した場合は、例えば、ハートハンターが完了した、終わった、と言ってください。</p>';
+ 'また、クエストをお気に入りに登録することもできます。</p>';

const LaunchRequestHandler = {
  canHandle(handlerInput) {
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    return handlerInput.requestEnvelope.request.type === 'LaunchRequest' || attributes.persistent.latestStartUp===undefined;
  },
  async handle(handlerInput) {
    Util.callDirectiveService(handlerInput, 'R Oクエスト管理を開始します。');
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    await handlerInput.attributesManager.getPersistentAttributes().then((persistent) => {

      if(Object.keys(persistent).length === 0) {
        persistent = {
          chara : [],
          latestStartUp : new Date(),
          latestCharaId : '1'
        };

        persistent.chara.push({
          id : 1,
          name : '',
          questRecords : []
        });
      }
      attributes.persistent = persistent;
      handlerInput.attributesManager.setSessionAttributes(attributes);
    });

    attributes.persistent.chara[0].questRecords.filter((a) => {
      return a.reorderDate && new Date(a.reorderDate) <= new Date();
    }).map((record)=> {
      const questData = QuestDataList.find(data => {
        return record.id == data.id;
      });
      Util.callDirectiveService(handlerInput, questData.quest + 'が再受注可能になりました。');

      ROQM.updateQuestRecord({
        id : record.id,
        reorderDate : null
      }, attributes.persistent.chara[0].questRecords);
    });

    // 最終起動日時をセット
    attributes.persistent.latestStartUp = new Date();

    return handlerInput.responseBuilder
      .speak('指示をください。')
      .reprompt('指示をください。')
      .getResponse();
  },
};

const ConfirmRoutineHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest'
                    && request.intent.name === 'ConfirmRoutineHandler';
  },
  handle(handlerInput) {
    Util.callDirectiveService(handlerInput, 'お気に入りが再受注できるかお伝えします。');
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    let outputSpeak = '';
    attributes.persistent.chara[0].questRecords.filter((a) => {
      return a.routine;
    }).map((record)=> {
      const questData = QuestDataList.find(data => {
        return record.id == data.id;
      });
      if(!record.reorderDate || new Date(record.reorderDate) <= new Date()) {
        outputSpeak += questData.quest + 'は受けられる状態です。';
      } else {
        const diffNum = Util.getDateDiffNum(new Date(), new Date(record.reorderDate));
        outputSpeak += questData.quest + 'は' + Util.convertHidukeYomi(diffNum) + '以降に受注できます。';
      }
    });
    return handlerInput.responseBuilder
      .speak(outputSpeak + '他に何かありますか？')
      .reprompt('他に何かありますか？')
      .getResponse();
  }
};

const ConfirmQuestHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest'
                    && request.intent.name === 'ConfirmQuestHandler';
  },
  handle(handlerInput) {
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const request = handlerInput.requestEnvelope.request;

    if(!Util.isResolution(request.intent.slot.ConfirmQuest)) {
      throw Error('NoQuestError');
    }

    const record = attributes.persistent.chara[0].questRecords.find((a) => {
      return Util.getResolutionId(request.intent.slot.ConfirmQuest) === a.id;
    });

    const questData = QuestDataList.find((a) => {
      return record.id === a.id;
    });

    if(record.length!==0 && record.reorderDate) {

      const diffNum = Util.getDateDiffNum(new Date(), new Date(record.reorderDate));
      return handlerInput.responseBuilder
        .speak(questData.quest + 'は' + Util.convertHidukeYomi(diffNum) + '以降に受注できます。他に何かありますか？')
        .reprompt('他に何かありますか？')
        .getResponse();
    } else {

      return handlerInput.responseBuilder
        .speak(questData.quest + 'は既に受注可能です。他に何かありますか？')
        .reprompt('他に何かありますか？')
        .getResponse();
    }

  }
};

/*
*
*/ 
const QuestRegistDeleteProgressHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest'
                    && (request.intent.name === 'QuestRegistIntent' || request.intent.name === 'QuestDeleteIntent')
                        && request.dialogState !=='COMPLETED';
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .addDelegateDirective()
      .getResponse();
  }
};

const QuestRegistDeleteConfirmHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest'
    && (request.intent.name === 'QuestRegistIntent' || request.intent.name === 'QuestDeleteIntent')
              && request.dialogState ==='COMPLETED';
  },
  handle(handlerInput) {

    const request = handlerInput.requestEnvelope.request;
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const slotName = request.intent.name === 'QuestRegistIntent' ? 'RegistQuest' : 'DeleteQuest';
    const questId = Util.getResolutionId(request.intent.slots[slotName]);
    const questName = Util.getResolutionName(request.intent.slots[slotName]);
    if(!Util.isResolution(request.intent.slots[slotName])) {
      throw Error('NoQuestError');
    } else if(slotName === 'RegistQuest' && ROQM.isExistQuestRoutine(questId, attributes.persistent.chara[0].questRecords)) {
      throw Error('AlreadyExistError');
    }

    if(request.intent.slots[slotName].confirmationStatus === 'NONE') {
      // クエストが設定されてきた場合の処理
      let outputSpeak = '';
      if(slotName === 'RegistQuest') {
        outputSpeak = questName + 'をお気に入りに登録します。よろしいですか？';
      } else { // slotName === 'DeleteQuest'
        outputSpeak = questName + 'をお気に入りから削除します。よろしいですか？';
      }

      return handlerInput.responseBuilder
        .speak(outputSpeak)
        .addConfirmSlotDirective(slotName)
        .getResponse();

    } else if(request.intent.slots[slotName].confirmationStatus === 'CONFIRMED') {
      // 登録/削除確認完了した場合

      let outputSpeak = '';
      if(slotName === 'RegistQuest') {
        // 登録ケース
        ROQM.updateQuestRecord({
          'id' : questId,
          'routine' : true
        }, attributes.persistent.chara[0].questRecords); 
        outputSpeak = questName + 'をお気に入りに登録しました。他に何かありますか？';
      } else { // slotName === 'DeleteQuest'
        ROQM.updateQuestRecord({
          'id' : questId,
          'routine' : false
        }, attributes.persistent.chara[0].questRecords); 
        outputSpeak = questName + 'をお気に入りから削除しました。他に何かありますか？';
      }
      handlerInput.attributesManager.setSessionAttributes(attributes);
      return handlerInput.responseBuilder
        .speak(outputSpeak)
        .reprompt('他に何かありますか？')
        .getResponse();

    } else { // confirmationStatus === DENIED
      return handlerInput.responseBuilder
        .speak('登録をキャンセルしました。他に何かありますか？')
        .reprompt('他に何かありますか？')
        .getResponse();
    }
  }
};

const QuestCompleteHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest'
                    && request.intent.name === 'QuestCompleteIntent';
  },
  handle(handlerInput) {

    const request = handlerInput.requestEnvelope.request;
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const questId = Util.getResolutionId(request.intent.slots.QuestName);
    const questName = Util.getResolutionName(request.intent.slots.QuestName);
    const updateDate = new Date();
    if(!Util.isResolution(request.intent.slots.QuestName)) {
      throw Error('NoQuestError');
    }
    const reorderInfo = ROQM.getReorderInfo(questId, updateDate);
    ROQM.updateQuestRecord({
      id : questId,
      reorderDate : reorderInfo.reorderDate
    }, attributes.persistent.chara[0].questRecords);
    
    handlerInput.attributesManager.setSessionAttributes(attributes);
    return handlerInput.responseBuilder
      .speak(questName + 'を完了にしました。'+ reorderInfo.speak + '以降に再受注できます。他に何かありますか？')
      .reprompt('他に何かありますか？')
      .getResponse();
  }
};

const HelpHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest'
                    && request.intent.name === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak(HELP_MESSAGE + '他に何かありますか？')
      .reprompt('他に何かありますか？')
      .getResponse();
  }
};

const StopHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest'
                    && request.intent.name === 'AMAZON.StopIntent';
  },
  handle(handlerInput) {
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    handlerInput.attributesManager.setPersistentAttributes(attributes.persistent);
    handlerInput.attributesManager.savePersistentAttributes();
    return handlerInput.responseBuilder
      .speak('R Oクエスト管理を終了します。')
      .getResponse();
  }
};
const CancelHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest'
                    && request.intent.name === 'AMAZON.CancelIntent';
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak('分かりました。他に何かありますか？')
      .reprompt('他に何かありますか？')
      .getResponse();
  }
};

const NoQuestErrorHandler = {
  canHandle(handlerInput, error) {
    return error.message === 'NoQuestError';
  },
  handle(handlerInput) {

    return handlerInput.responseBuilder
      .speak('該当のクエストが見つかりません。他に何かありますか？')
      .reprompt('他に何かありますか？')
      .getResponse();
  }
};

const AlreadyExistErrorHandler = {
  canHandle(handlerInput, error) {
    return error.message === 'AlreadyExistError';
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak('既にクエストが登録されています。他に何かありますか？')
      .reprompt('他に何かありますか？')
      .getResponse();
  }
};

const skillBuilder = Alexa.SkillBuilders.standard();
exports.handler = skillBuilder
  .addRequestHandlers(
    LaunchRequestHandler,
    QuestRegistDeleteProgressHandler,
    QuestRegistDeleteConfirmHandler,
    QuestCompleteHandler,
    ConfirmRoutineHandler,
    ConfirmQuestHandler,
    HelpHandler,
    StopHandler,
    CancelHandler,
    MyAskCommon.SessionEndedRequestHandler
  )
  .addRequestInterceptors(
    MyAskCommon.DebugRequestInterceptor
  )
  .addResponseInterceptors(
    MyAskCommon.DebugResponseInterceptor
  )
  .addErrorHandlers(
    NoQuestErrorHandler,
    AlreadyExistErrorHandler,
    MyAskCommon.FatalErrorHandler
  )
  .withTableName('ROQuestManagerTable')
  .withAutoCreateTable(false)
  .lambda();