const SHEET_NAMES = ['modules','charger_categories','chargers','charger_rules','tools','vibe_cards','quotes','revise_repeat','learning_channels'];
const CACHE_SECONDS = 60;

const ADMIN_TOKEN = 'clv_admin_2024'; // Must match admin.html



function jsonOut(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// Finds a row by value in a column (0-indexed col), returns 1-indexed row number or null
function findRow(sheet, col, value) {
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][col]).trim() === String(value).trim()) return i + 1;
  }
  return null;
}


function handleWrite(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const p  = e.parameter;
  try {
    switch (p.action) {

      // ── TOOLS (16 cols: id,code,name,description,icon,type,mood,persist,placeholder,fullscreen,xp,quest_low,quest_mid,quest_high,order,active)
      case 'addTool':
        ss.getSheetByName('tools').appendRow([p.id,p.code,p.name,p.description,p.icon,p.type,p.mood,p.persist,p.placeholder,p.fullscreen,p.xp,p.quest_low,p.quest_mid,p.quest_high,p.order,p.active]);
        break;
      case 'editTool': {
        const s = ss.getSheetByName('tools'), row = findRow(s,0,p.findId);
        if (!row) throw new Error('Tool not found: '+p.findId);
        s.getRange(row,1,1,16).setValues([[p.id,p.code,p.name,p.description,p.icon,p.type,p.mood,p.persist,p.placeholder,p.fullscreen,p.xp,p.quest_low,p.quest_mid,p.quest_high,p.order,p.active]]); break;
      }
      case 'deleteTool': {
        const s = ss.getSheetByName('tools'), row = findRow(s,0,p.findId);
        if (!row) throw new Error('Tool not found');
        s.deleteRow(row); break;
      }

      // ── CHARGER CATEGORIES (6 cols: id,name,tagline,icon,order,active)
      case 'addChargerCategory':
        ss.getSheetByName('charger_categories').appendRow([p.id,p.name,p.tagline,p.icon,p.order,p.active]);
        break;
      case 'editChargerCategory': {
        const s = ss.getSheetByName('charger_categories'), row = findRow(s,0,p.findId);
        if (!row) throw new Error('Category not found');
        s.getRange(row,1,1,6).setValues([[p.id,p.name,p.tagline,p.icon,p.order,p.active]]); break;
      }
      case 'deleteChargerCategory': {
        const s = ss.getSheetByName('charger_categories'), row = findRow(s,0,p.findId);
        if (!row) throw new Error('Category not found');
        s.deleteRow(row); break;
      }

      // ── CHARGERS (16 cols: id,category_id,name,description,icon,type,mood,persist,placeholder,fullscreen,xp,quest_low,quest_mid,quest_high,order,active)
      case 'addCharger':
        ss.getSheetByName('chargers').appendRow([p.id,p.category_id,p.name,p.description,p.icon,p.type,p.mood,p.persist,p.placeholder,p.fullscreen,p.xp,p.quest_low,p.quest_mid,p.quest_high,p.order,p.active]);
        break;
      case 'editCharger': {
        const s = ss.getSheetByName('chargers'), row = findRow(s,0,p.findId);
        if (!row) throw new Error('Charger not found');
        s.getRange(row,1,1,16).setValues([[p.id,p.category_id,p.name,p.description,p.icon,p.type,p.mood,p.persist,p.placeholder,p.fullscreen,p.xp,p.quest_low,p.quest_mid,p.quest_high,p.order,p.active]]); break;
      }
      case 'deleteCharger': {
        const s = ss.getSheetByName('chargers'), row = findRow(s,0,p.findId);
        if (!row) throw new Error('Charger not found');
        s.deleteRow(row); break;
      }

      // ── CHARGER RULES (4 cols: id,rule,order,active)
      case 'addRule':
        ss.getSheetByName('charger_rules').appendRow([p.id,p.rule,p.order,p.active]);
        break;
      case 'editRule': {
        const s = ss.getSheetByName('charger_rules'), row = findRow(s,1,p.findRule);
        if (!row) throw new Error('Rule not found');
        s.getRange(row,1,1,4).setValues([[p.id,p.rule,p.order,p.active]]); break;
      }
      case 'deleteRule': {
        const s = ss.getSheetByName('charger_rules'), row = findRow(s,1,p.findRule);
        if (!row) throw new Error('Rule not found');
        s.deleteRow(row); break;
      }

      // ── VIBE CARDS (10 cols: id,type,title,content,placeholder,timer,xp,icon,category,active)
      case 'addVibeCard':
        ss.getSheetByName('vibe_cards').appendRow([p.id,p.type,p.title,p.content,p.placeholder,p.timer,p.xp,p.icon,p.category,p.active]);
        break;
      case 'editVibeCard': {
        const s = ss.getSheetByName('vibe_cards'), row = findRow(s,0,p.findId);
        if (!row) throw new Error('Vibe card not found');
        s.getRange(row,1,1,10).setValues([[p.id,p.type,p.title,p.content,p.placeholder,p.timer,p.xp,p.icon,p.category,p.active]]); break;
      }
      case 'deleteVibeCard': {
        const s = ss.getSheetByName('vibe_cards'), row = findRow(s,0,p.findId);
        if (!row) throw new Error('Vibe card not found');
        s.deleteRow(row); break;
      }

      // ── QUOTES (7 cols: id,quote,author,category,order,active,action)
      case 'addQuote':
        ss.getSheetByName('quotes').appendRow([p.id,p.quote,p.author,p.category,p.order,p.active,p.action_col||'']);
        break;
      case 'editQuote': {
        const s = ss.getSheetByName('quotes'), row = findRow(s,1,p.findQuote);
        if (!row) throw new Error('Quote not found');
        s.getRange(row,1,1,7).setValues([[p.id,p.quote,p.author,p.category,p.order,p.active,p.action_col||'']]); break;
      }
      case 'deleteQuote': {
        const s = ss.getSheetByName('quotes'), row = findRow(s,1,p.findQuote);
        if (!row) throw new Error('Quote not found');
        s.deleteRow(row); break;
      }

      // ── REVISE & REPEAT (7 cols: id,title,content,image_url,type,order,active)
      case 'addRevise':
        ss.getSheetByName('revise_repeat').appendRow([p.id,p.title,p.content,p.image_url,p.type,p.order,p.active]);
        break;
      case 'editRevise': {
        const s = ss.getSheetByName('revise_repeat'), row = findRow(s,1,p.findTitle);
        if (!row) throw new Error('Revise item not found');
        s.getRange(row,1,1,7).setValues([[p.id,p.title,p.content,p.image_url,p.type,p.order,p.active]]); break;
      }
      case 'deleteRevise': {
        const s = ss.getSheetByName('revise_repeat'), row = findRow(s,1,p.findTitle);
        if (!row) throw new Error('Revise item not found');
        s.deleteRow(row); break;
      }

      // ── LEARNING CHANNELS (7 cols: id,name,url,description,category,order,active)
      case 'addChannel':
        ss.getSheetByName('learning_channels').appendRow([p.id,p.name,p.url,p.description,p.category,p.order,p.active]);
        break;
      case 'editChannel': {
        const s = ss.getSheetByName('learning_channels'), row = findRow(s,1,p.findName);
        if (!row) throw new Error('Channel not found');
        s.getRange(row,1,1,7).setValues([[p.id,p.name,p.url,p.description,p.category,p.order,p.active]]); break;
      }
      case 'deleteChannel': {
        const s = ss.getSheetByName('learning_channels'), row = findRow(s,1,p.findName);
        if (!row) throw new Error('Channel not found');
        s.deleteRow(row); break;
      }

      // ── MODULES
      case 'toggleModule': {
        const s = ss.getSheetByName('modules');
        const data = s.getDataRange().getValues();
        const heads = data[0].map(h => String(h).toLowerCase().trim());
        const idCol  = heads.findIndex(h => h==='id'||h==='module_id');
        const actCol = heads.findIndex(h => h==='active');
        for (let i=1; i<data.length; i++) {
          if (String(data[i][idCol])===p.moduleId) {
            s.getRange(i+1,actCol+1).setValue(p.active==='true'?'TRUE':'FALSE'); break;
          }
        }
        break;
      }
      default: throw new Error('Unknown action: '+p.action);
    }
    clearCache();
return jsonOut({success:true});
  } catch(err) {
    return jsonOut({success:false, error:err.message});
  }
}






function setupClarvoyanceData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = {
    modules: {
      headers: ['id','name','description','order','active'],
      data: [
        ['tools','Tools','T1-T5 tools for resolving conflicted mind',1,true],
        ['chargers','Mind Chargers','Charge your mind into a desired state',2,true],
        ['vibe_feed','Vibe Feed','Random cards to shift focus',3,true],
        ['quests','Quests','Mood-based guided missions',4,true],
        ['revise_repeat','Revise & Repeat','Philosophy, quotes, images',5,true],
        ['learning_channels','Learning Channels','Curated links for deeper learning',6,true],
        ['non_negotiables','Non-Negotiables','Daily must-do commitments',7,true],
        ['goals','Goals','Current desires to manifest',8,true],
      ]
    },
    charger_categories: {
      headers: ['id','name','tagline','icon','order','active'],
      data: [
        ['sadhu','Sadhu Bhav','Pure being, zero ego','🧘',1,true],
        ['confidence','Confidence','Own your power fully','⚡',2,true],
        ['non_negative','Non-Negative','Zero complaints, zero blame','✨',3,true],
      ]
    },
    chargers: {
      headers: ['id','category_id','name','description','icon','type','mood','persist','placeholder','fullscreen','xp','quest_low','quest_mid','quest_high','order','active'],
      data: [
        ['conf_1','confidence','I Am Confident','Charge into total confidence','⚡','textarea','all','yes','Start writing as that fully confident version of you...','yes',15,'Write one confident thing','Tell a story where you owned the room','Write your most powerful confident version',1,true],
        ['sadhu_1','sadhu','Pure Presence','Charge into complete inner peace','🧘','textarea','all','yes','Write from the place of pure being...','yes',15,'Describe one moment of peace','Write about being free of ego','Describe your highest self',1,true],
        ['nn_1','non_negative','Zero Complaints','Charge into a no-complaint state','✨','textarea','all','yes','Write as someone who sees only solutions...','yes',15,'Write one thing you stopped complaining about','Choose solution over blame','Write your zero-complaint day',1,true],
      ]
    },
    charger_rules: {
      headers: ['id','rule','order','active'],
      data: [
        [1,'Badi badi baate — go big, no limits',1,true],
        [2,'Real or fake story — feeling matters not truth',2,true],
        [3,'Be childish and kiddish — bypass your critical mind',3,true],
        [4,'Speak while you write — vary your tone',4,true],
        [5,'Use movements and gestures — body anchors the state',5,true],
        [6,'Assume you are already there — write from inside the state',6,true],
      ]
    },
    tools: {
      headers: ['id','code','name','description','icon','type','mood','persist','placeholder','fullscreen','xp','quest_low','quest_mid','quest_high','order','active'],
      data: [
        ['t1','T1','Written Clarity','Externalise and clarify your mind','📝','textarea','low','yes','Write freely about what is on your mind...','yes',10,'Write what is bothering you','Write what needs clarity','Resolve your biggest open loop',1,true],
        ['t2','T2','What I Don\'t Want','Reveals what you truly want','🚫','textarea','low','yes','List everything you do not want...','yes',10,'List 3 things you do not want','Write what to move away from','What do you absolutely not want',2,true],
        ['t3','T3','New Story','Rewrite your narrative','📖','textarea','high','yes','Write your new story as if already true...','yes',20,'One sentence of your new story','A paragraph of the life you are creating','Full new story with total belief',3,true],
        ['t4','T4','Find Better Feeling','Reach for a slightly better thought','🌅','textarea','low','yes','What feels even a little better right now...','yes',10,'One thought that feels better','3 better-feeling thoughts','Climb the emotional scale',4,true],
        ['t5','T5','The Culprit','Reclaim your power as creator','🎯','textarea','mid','yes','Where have you been giving your power away...','yes',15,'One area of full responsibility','How you created this and will shift it','Full power reclamation statement',5,true],
      ]
    },
    vibe_cards: {
      headers: ['id','title','content','type','linked_tool','linked_charger','mood_min','mood_max','order','active'],
      data: [
        [1,'Feel it first','The feeling is the prayer. Feel good now and watch things change.','quote','','',0,100,1,true],
        [2,'Quick Clarity','5 minutes with Written Clarity right now. Just write.','challenge','t1','',0,40,2,true],
        [3,'Charge Up','Open Confidence charger. Write as your most powerful self for 3 minutes.','challenge','','conf_1',50,100,3,true],
      ]
    },
    quotes: {
      headers: ['id','quote','author','category','order','active'],
      data: [
        [1,'The way you feel is your point of attraction.','Abraham Hicks','vibration',1,true],
        [2,'A belief is just a thought you keep thinking.','Abraham Hicks','mindset',2,true],
        [3,'You cannot have a happy ending to an unhappy journey.','Abraham Hicks','alignment',3,true],
      ]
    },
    revise_repeat: {
      headers: ['id','title','content','image_url','type','order','active'],
      data: [
        [1,'Feelings Attract Reality','How you feel is what you broadcast. Reality matches that broadcast.','','philosophy',1,true],
        [2,'The Vortex','Everything you want is already in your vortex. Align through feeling.','','philosophy',2,true],
      ]
    },
    learning_channels: {
      headers: ['id','name','url','description','category','order','active'],
      data: [
        [1,'Abraham Hicks Official','https://www.youtube.com/@AbrahamHicks','Original LOA teachings','LOA',1,true],
        [2,'Neville Goddard','https://www.youtube.com/@NevilleGoddardLectures','Manifestation through imagination','Manifestation',2,true],
      ]
    },
  };

  SHEET_NAMES.forEach((sheetName, i) => {
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) sheet = ss.insertSheet(sheetName);
    const config = sheets[sheetName];
    sheet.clearContents();
    sheet.getRange(1,1,1,config.headers.length).setValues([config.headers]);
    if (config.data.length > 0)
      sheet.getRange(2,1,config.data.length,config.headers.length).setValues(config.data);
  });

  Logger.log('✅ Done');
}

function doGet(e) {



const WRITE_ACTIONS = [
  'addTool','editTool','deleteTool',
  'addChargerCategory','editChargerCategory','deleteChargerCategory',
  'addCharger','editCharger','deleteCharger',
  'addRule','editRule','deleteRule',
  'addVibeCard','editVibeCard','deleteVibeCard',
  'addQuote','editQuote','deleteQuote',
  'addRevise','editRevise','deleteRevise',
  'addChannel','editChannel','deleteChannel',
  'toggleModule'
];
if (WRITE_ACTIONS.includes(e.parameter.action)) {
  if (e.parameter.token !== ADMIN_TOKEN) return jsonOut({success:false,error:'Unauthorized'});
  return handleWrite(e);
}



const params = e && e.parameter ? e.parameter : {};
const isAdmin = params.admin === '1' && params.token === ADMIN_TOKEN;
const requestedSheet = params.sheet || null;
const sheetsToFetch = requestedSheet ? [requestedSheet] : SHEET_NAMES;
const cacheKey = 'clarvoyance_' + (requestedSheet || 'all');
const cache = CacheService.getScriptCache();
if (!isAdmin) {
  const cached = cache.get(cacheKey);
  if (cached) return ContentService.createTextOutput(cached).setMimeType(ContentService.MimeType.JSON);
}

const ss = SpreadsheetApp.getActiveSpreadsheet();
const data = {};
sheetsToFetch.forEach(sheetName => {
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return;
  const rows = sheet.getDataRange().getValues();
  if (rows.length < 2) { data[sheetName] = []; return; }
  const headers = rows[0];
  const activeIdx = headers.indexOf('active');
  const orderIdx = headers.indexOf('order');
  let records = rows.slice(1)
    .filter(row => isAdmin || activeIdx === -1 || row[activeIdx] === true || String(row[activeIdx]).toUpperCase() === 'TRUE')
    .map(row => { const obj = {}; headers.forEach((h,i) => obj[h] = row[i]); return obj; });
  if (orderIdx !== -1) records.sort((a,b) => (a.order||0)-(b.order||0));
  data[sheetName] = records;
});

  const json = JSON.stringify(data);
  cache.put(cacheKey, json, CACHE_SECONDS);
  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}

function clearCache() {
  CacheService.getScriptCache().removeAll(SHEET_NAMES.map(n => 'clarvoyance_'+n).concat(['clarvoyance_all']));
}

