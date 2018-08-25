const QuestDataList = require('./data/quest.json');
const Util = require('./ask-util');

const getReorderInfo = function(id, date) {
  const questData = QuestDataList.find((a) => {
    return a.id === id;
  });
  const baseDate = {
    year : date.getFullYear(),
    month : date.getMonth(),
    date : date.getDate(),
    hours : date.getHours(),
    minutes : date.getMinutes(),
    day : date.getDay(),
  };
  let reorderDate =null;
  if(questData.cycle > 0) {
    // 午前5時再受注可能タイプ
    let reorderDateNum = questData.cycle-0;
    if(baseDate.hours >= 0 && baseDate.hours < 5) {
      reorderDateNum = reorderDateNum-1;
    }
    reorderDate = new Date(baseDate.year,baseDate.month,baseDate.date+reorderDateNum, 5);

  } else if (questData.cycle === '0') {
    // 翌火曜日正午再受注可能タイプ

    // 翌火曜日正午までの日数を取得
    let reorderDateNum = (9-baseDate.day) % 7;
    if(baseDate.day === 2 && baseDate.hours >= 12) reorderDateNum = 7;

    reorderDate = new Date(baseDate.year,baseDate.month,baseDate.date+reorderDateNum, 12);
    // 再受注可能日時情報を返却
  } else {
    // イレギュラー
    if(questData.id ==='6') {
      reorderDate = new Date(baseDate.year,baseDate.month,baseDate.date,baseDate.hours+(questData.hour-0), baseDate.minutes);
    } else if (questData.id ==='9999'){
      reorderDate = new Date(baseDate.year,baseDate.month,baseDate.date,baseDate.hours+(questData.hour-0), baseDate.minutes);
    } else {
      throw Error('getReorderTime fatalError');
    }
  }

  return {
    'reorderDate' : reorderDate,
    'speak' : Util.conSpeechDayAfter(Util.getDateDiffNum(date,reorderDate)) + 'の' + Util.conSpeechTimeHH12(reorderDate)
  };
};
exports.getReorderInfo = getReorderInfo;

//reorderDateを更新したくない場合は引数に設定しないこと！
const updateQuestRecord = function(update, rec) {
  if(!isExistQuest(update.id,rec)) {
    // データが無い場合は登録
    let routine = false;
    let reorderDate = null;
    if(update.routine !== undefined) {
      routine = update.routine;
    } 
    if(update.reorderDate !== undefined) {
      reorderDate = update.reorderDate;
    } 
    rec.push({
      'id' : update.id,
      'routine' : routine,
      'reorderDate' : reorderDate
    });
  } else {
    // データがある場合は引数で更新
    const target = rec.find((a) => {
      return a.id === update.id;
    });
    if(update.routine !== undefined) {
      target.routine = update.routine;
    }
    if(update.reorderDate !== undefined) {
      target.reorderDate = update.reorderDate;
    }
  }

  return true;
};
exports.updateQuestRecord = updateQuestRecord;

const isExistQuest = function(id,rec) {
  return rec.findIndex((a)=> {
    return a.id === id;
  }) === -1 ? false : true;
};
exports.isExistQuest = isExistQuest;

const isExistQuestRoutine = function(id,rec) {
  const target = rec.find((a)=> {
    return a.id === id;
  });
  return target ? target.routine : false;
};
exports.isExistQuestRoutine = isExistQuestRoutine;