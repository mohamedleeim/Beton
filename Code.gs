/**
 * Concrete Management System - Google Apps Script Backend
 * Handles data persistence, email notifications, and sheet management.
 */

function doGet(e) {
  var action = e.parameter.action;
  var sheetName = e.parameter.sheetName || "PV";
  
  if (action == 'read') {
    return ContentService.createTextOutput(JSON.stringify(readData(sheetName)))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  if (action == 'getOptions') {
    return ContentService.createTextOutput(JSON.stringify(getOptions()))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  if (action == 'initialize') {
    initializeSheets();
    return ContentService.createTextOutput("Sheets initialized successfully")
      .setMimeType(ContentService.MimeType.TEXT);
  }
  
  return HtmlService.createHtmlOutput("<h1>Concrete Management System API</h1><p>Running...</p>")
    .setTitle('نظام إدارة البيانات')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function doPost(e) {
  try {
    var requestData = JSON.parse(e.postData.contents);
    var action = requestData.action;
    var sheetName = requestData.sheetName || "PV";
    var result;
    
    if (action == 'create') {
      result = createData(sheetName, requestData.data);
      // Check for high priority notification
      var priority = requestData.data["PRIORITE"];
      if (sheetName === "TACHES" && (priority === "High" || priority === "Urgent" || priority === "عالية" || priority === "عاجلة")) {
        sendTaskEmail(requestData.data, "أولوية عالية");
      }
    } else if (action == 'update') {
      result = updateData(sheetName, requestData.id, requestData.data);
      // Check for high priority notification on update
      var priority = requestData.data["PRIORITE"];
      if (sheetName === "TACHES" && (priority === "High" || priority === "Urgent" || priority === "عالية" || priority === "عاجلة")) {
        sendTaskEmail(requestData.data, "تحديث مهمة عاجلة");
      }
    } else if (action == 'delete') {
      result = deleteData(sheetName, requestData.id);
    } else if (action == 'uploadImage') {
      result = uploadImageToDrive(requestData.base64, requestData.fileName);
    } else if (action == 'checkOverdue') {
      result = checkOverdueTasks();
    } else if (action == 'setupTriggers') {
      result = setupDailyTrigger();
    } else if (action == 'initialize') {
      result = initializeSheets();
    }
    
    return ContentService.createTextOutput(JSON.stringify({ success: true, result: result }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function readData(sheetName) {
  var sheet = getTargetSheet(sheetName);
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  var headers = data[0];
  var result = [];
  for (var i = 1; i < data.length; i++) {
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      var value = data[i][j];
      if (value instanceof Date) {
        // If it's just a date (time is 00:00:00)
        if (value.getHours() === 0 && value.getMinutes() === 0 && value.getSeconds() === 0) {
          obj[headers[j]] = Utilities.formatDate(value, Session.getScriptTimeZone(), "yyyy-MM-dd");
        } else {
          // It's a full timestamp - convert to ISO string for React
          obj[headers[j]] = Utilities.formatDate(value, "UTC", "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");
        }
      } else {
        obj[headers[j]] = value;
      }
    }
    result.push(obj);
  }
  return result;
}

function createData(sheetName, item) {
  var sheet = getTargetSheet(sheetName);
  var headers = sheet.getDataRange().getValues()[0];
  var newRow = [];
  
  if (!item.ID) {
    item.ID = generateId(sheetName);
  }
  
  var now = new Date();
  if (sheetName === "PV") {
    if (!item["DATE"]) item["DATE"] = Utilities.formatDate(now, Session.getScriptTimeZone(), "yyyy-MM-dd");
    if (!item["HEURE"]) item["HEURE"] = Utilities.formatDate(now, Session.getScriptTimeZone(), "HH:mm");
  } else if (sheetName === "TACHES" || sheetName === "PROJETS") {
    if (!item["DATE"]) item["DATE"] = Utilities.formatDate(now, Session.getScriptTimeZone(), "yyyy-MM-dd");
    item["DERNIERE MISE A JOUR"] = Utilities.formatDate(now, "UTC", "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");
  }

  for (var i = 0; i < headers.length; i++) {
    newRow.push(item[headers[i]] || "");
  }
  sheet.appendRow(newRow);
  return item.ID;
}

function updateData(sheetName, id, item) {
  var sheet = getTargetSheet(sheetName);
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] == id) {
      var now = new Date();
      if (sheetName === "TACHES" || sheetName === "PROJETS") {
        item["DERNIERE MISE A JOUR"] = Utilities.formatDate(now, "UTC", "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");
      }
      
      for (var j = 0; j < headers.length; j++) {
        if (headers[j] !== "ID" && item[headers[j]] !== undefined) {
          sheet.getRange(i + 1, j + 1).setValue(item[headers[j]]);
        }
      }
      return true;
    }
  }
  return false;
}

function deleteData(sheetName, id) {
  var sheet = getTargetSheet(sheetName);
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] == id) {
      sheet.deleteRow(i + 1);
      return true;
    }
  }
  return false;
}

function getOptions() {
  return {
    projets: readData("PROJETS").map(function(p) { 
      return { 
        name: p["PROJET"], 
        client: p["CLIENT"], 
        entreprise: p["ENTREPRISE DES TRAVAUX"],
        chef: p["CHEF CHANTIER"],
        icon: p["ICON"]
      }; 
    }),
    responsables: readData("RESPONSABLES").map(function(r) { return r["NOM RESPONSABLE"]; }),
    livreurs: readData("LIVREURS").map(function(l) { return l["LIVREUR BETON"]; }),
    clients: Array.from(new Set(readData("PROJETS").map(function(p) { return p["CLIENT"]; }))).filter(Boolean)
  };
}

function getTargetSheet(sheetName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  var expectedHeaders = getHeadersForSheet(sheetName);
  
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    if (expectedHeaders.length > 0) sheet.appendRow(expectedHeaders);
  } else {
    // Ensure all expected headers exist
    ensureHeaders(sheet, expectedHeaders);
  }
  return sheet;
}

function ensureHeaders(sheet, expectedHeaders) {
  if (expectedHeaders.length === 0) return;
  
  var range = sheet.getRange(1, 1, 1, sheet.getLastColumn() || 1);
  var currentHeaders = range.getValues()[0];
  var missingHeaders = [];
  
  for (var i = 0; i < expectedHeaders.length; i++) {
    if (currentHeaders.indexOf(expectedHeaders[i]) === -1) {
      missingHeaders.push(expectedHeaders[i]);
    }
  }
  
  if (missingHeaders.length > 0) {
    var lastCol = sheet.getLastColumn();
    // If sheet is empty, just set headers
    if (lastCol === 0) {
      sheet.getRange(1, 1, 1, expectedHeaders.length).setValues([expectedHeaders]);
    } else {
      // Append missing headers to the end of the first row
      sheet.getRange(1, lastCol + 1, 1, missingHeaders.length).setValues([missingHeaders]);
    }
  }
}

function getHeadersForSheet(sheetName) {
  var configs = {
    "PV": ["ID", "PV N", "DATE", "HEURE", "CLIENT", "ENTREPRISE DES TRAVAUX", "PROJET", "PARTIE D'OUVRAGE", "MODE PRELEVEMENT", "TYPE PRELEVEMENT", "CLASSE BETON", "AFFAISSEMENT (mm)", "REF CONE D'ABRAMS", "TEMPERATURE AMBIANTE", "TEMPERATURE BETON", "REF THERMOMETRE", "POUR ESSAI", "TYPE DE MOULE", "NOMBRE DE MOULES", "SERIE DES MOULES", "INFOS BETON BETONNIERE", "INFOS BETON MANUELLE", "INFOS BETON LIVRE", "LIVREUR BETON", "N DE BON", "L'HEURE DE DEPART", "GPS", "IMAGE"],
    "TACHES": ["ID", "DATE", "PROJET", "NOM TACHE", "TYPE TACHE", "ENTREPRISE DES TRAVAUX", "CHEF CHANTIER", "STATUT TACHE", "PRIORITE", "LIVREUR BETON", "TYPE COULAGE", "RESPONSABLE", "COMMENTAIRES", "DERNIERE MISE A JOUR", "GPS", "IMAGE"],
    "PROJETS": ["ID", "DATE", "CLIENT", "PROJET", "ICON", "ENTREPRISE DES TRAVAUX", "CHEF CHANTIER", "NUM", "LOCALISATION", "STATUT", "COMMENTAIRES", "DERNIERE MISE A JOUR", "GPS", "IMAGE"],
    "RESPONSABLES": ["ID", "NOM RESPONSABLE", "NUM1", "NUM2", "EMAIL"],
    "LIVREURS": ["ID", "LIVREUR BETON"]
  };
  return configs[sheetName] || [];
}

function generateId(sheetName) {
  var sheet = getTargetSheet(sheetName);
  var data = sheet.getDataRange().getValues();
  var prefixMap = {
    "PV": "PV",
    "TACHES": "TCH",
    "PROJETS": "PRJ",
    "RESPONSABLES": "RES",
    "LIVREURS": "BT"
  };
  var prefix = prefixMap[sheetName] || "ID";
  
  if (data.length <= 1) return prefix + "-001";
  
  var lastId = data[data.length - 1][0];
  if (typeof lastId !== 'string' || !lastId.includes('-')) return prefix + "-001";
  
  var parts = lastId.split('-');
  var num = parseInt(parts[1]) + 1;
  return prefix + "-" + ("000" + num).slice(-3);
}

function initializeSheets() {
  var sheets = ["PV", "TACHES", "PROJETS", "RESPONSABLES", "LIVREURS"];
  sheets.forEach(function(s) {
    getTargetSheet(s);
  });
  return true;
}

function uploadImageToDrive(base64Data, fileName) {
  try {
    var folderName = "ConcreteApp_Images";
    var folders = DriveApp.getFoldersByName(folderName);
    var folder;
    if (folders.hasNext()) {
      folder = folders.next();
    } else {
      folder = DriveApp.createFolder(folderName);
    }
    
    var contentType = base64Data.substring(5, base64Data.indexOf(';'));
    var bytes = Utilities.base64Decode(base64Data.split(',')[1]);
    var blob = Utilities.newBlob(bytes, contentType, fileName);
    var file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    return "https://drive.google.com/uc?export=view&id=" + file.getId();
  } catch (e) {
    return "Error: " + e.toString();
  }
}

function sendTaskEmail(task, reason) {
  var recipient = "";
  var responsableName = task["RESPONSABLE"];
  
  if (responsableName) {
    var responsables = readData("RESPONSABLES");
    var found = responsables.find(function(r) { return r["NOM RESPONSABLE"] === responsableName; });
    if (found && found["EMAIL"]) {
      recipient = found["EMAIL"];
    }
  }
  
  if (!recipient) {
    recipient = Session.getEffectiveUser().getEmail();
  }

  var subject = "تنبيه مهمة: " + (task["NOM TACHE"] || "بدون اسم") + " [" + reason + "]";
  var body = "تحية طيبة،\n\n" +
             "هناك تنبيه بخصوص مهمة في النظام:\n\n" +
             "📌 المهمة: " + (task["NOM TACHE"] || "-") + "\n" +
             "📅 التاريخ: " + (task["DATE"] || "-") + "\n" +
             "⚡ الأولوية: " + (task["PRIORITE"] || "-") + "\n" +
             "👤 المسؤول: " + (task["RESPONSABLE"] || "-") + "\n" +
             "🏗️ المشروع: " + (task["PROJET"] || "-") + "\n" +
             "📊 الحالة: " + (task["STATUT TACHE"] || "-") + "\n" +
             "📝 السبب: " + reason + "\n\n" +
             "يرجى مراجعة التطبيق للمتابعة.\n" +
             "تم الإرسال تلقائياً بواسطة نظام الإدارة.";
             
  try {
    MailApp.sendEmail(recipient, subject, body);
    return true;
  } catch (e) {
    console.error("Failed to send email: " + e.toString());
    return false;
  }
}

function checkOverdueTasks() {
  var tasks = readData("TACHES");
  var now = new Date();
  var overdueCount = 0;
  
  tasks.forEach(function(task) {
    if (task["STATUT TACHE"] !== "Terminée" && task["STATUT TACHE"] !== "مكتملة" && task["DATE"]) {
      var taskDate = new Date(task["DATE"]);
      if (taskDate < now) {
        sendTaskEmail(task, "مهمة متأخرة");
        overdueCount++;
      }
    }
  });
  return overdueCount;
}

function setupDailyTrigger() {
  var triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(function(t) {
    if (t.getHandlerFunction() === 'checkOverdueTasks') {
      ScriptApp.deleteTrigger(t);
    }
  });
  
  ScriptApp.newTrigger('checkOverdueTasks')
    .timeBased()
    .everyDays(1)
    .atHour(8)
    .create();
  return true;
}
