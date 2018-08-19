const QuestDataList = require('./data/quest.json');
const Util = require('./ask-util');

class Persistent {
  constractor() {
    this.chara = [];
    this.latestLogin = new Date();
    this.latestCharaId = '';
  }

  addChara(id) {
    this.chara.push(new Charactor(id));
  }
}
exports.Persistent = Persistent;

class Charactor {
  constractor(id) {
    this.charaId =id;
    this.charaName = '';
    this.questRecords = {
      'id' : '',
      'questRecords' : []
    };
  }
}

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

  if(questData.cycle > 0) {
    // 午前5時再受注可能タイプ
    let reorderDateNum = questData.cycle-0;
    if(baseDate.hours >= 0 && baseDate.hours < 5) {
      reorderDateNum = reorderDateNum-1;
    }
    let reorderDate = new Date(baseDate.year,baseDate.month,baseDate.date+reorderDateNum, 5);

    return {
      'reorderDate' : reorderDate,
      'speak' : Util.convertHidukeYomi(reorderDateNum) + 'の午前五時'
    };
  } else if (questData.cycle === '0') {
    // 翌火曜日正午再受注可能タイプ

    // 翌火曜日正午までの日数を取得
    let reorderDateNum = (9-baseDate.day) % 7;
    if(baseDate.day === 2 && baseDate.hours >= 12) reorderDateNum = 7;

    let reorderDate = new Date(baseDate.year,baseDate.month,baseDate.date+reorderDateNum, 12);
    // 再受注可能日時情報を返却
    if(reorderDateNum <3) {
      return {
        'reorderDate' : reorderDate,
        'speak' : Util.convertHidukeYomi(reorderDateNum) + 'の正午'
      };
    } else {
      return {
        'reorderDate' : reorderDate,
        'speak' : (reorderDate.getMonth()+1) + '月' + reorderDate.getDate() + '日の正午'
      };
    }
  } else {
    // イレギュラー
    if(questData.id ==='6') {
      let reorderDate = new Date(baseDate.year,baseDate.month,baseDate.date,baseDate.hours+questData.hour, baseDate.minutes);
      return {
        'reorderDate' : reorderDate,
        'speak' : (reorderDate.getMonth()+1) + '月' + reorderDate.getDate() + '日の' + reorderDate.getHours() + '時' + reorderDate.getMinutes() + '分'
      };
    } else if (questData.id ==='9999'){
      let reorderDate = new Date(baseDate.year,baseDate.month,baseDate.date,baseDate.hours+questData.hour, baseDate.minutes);
      return {
        'reorderDate' : reorderDate,
        'speak' : (reorderDate.getMonth()+1) + '月' + reorderDate.getDate() + '日の' + reorderDate.getHours() + '時' + reorderDate.getMinutes() + '分'
      };
    } else {
      throw Error('getReorderTime fatalError');
    }
  }
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