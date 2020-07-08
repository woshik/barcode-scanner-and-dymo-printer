'use strict';

var IMEIcodes = [],
  barcode = '',
  startAndStopProcessDOMElement,
  printCount = 1,
  checkClickButton = 2,
  dymoLogScreen,
  dymoLabel = null,
  loop = false,
  imeiIndex = 0,
  printersSelect,
  labelFileLoadElement;

window.addEventListener('DOMContentLoaded', function () {
  printersSelect = document.getElementById('printersSelect');
  dymoLogScreen = document.getElementById('dymo-log-screen');
  startAndStopProcessDOMElement = document.querySelectorAll('#stop-start-process button');
  labelFileLoadElement = document.getElementById('load-label-file');
  processScanAndPrint(false, 2);
});

function processScanAndPrint(isScanAndPrint, ck) {
  if (ck !== checkClickButton) {
    if (isScanAndPrint) {
      document.addEventListener('keypress', barcodeScanner);
      printCount = parseInt(document.querySelector('#stop-start-process input').value);
      startAndStopProcessDOMElement[0].classList.add('active');
      startAndStopProcessDOMElement[1].classList.remove('active');
    } else {
      document.removeEventListener('keypress', barcodeScanner);
      startAndStopProcessDOMElement[1].classList.add('active');
      startAndStopProcessDOMElement[0].classList.remove('active');
    }

    checkClickButton = ck;
  }
}

function barcodeScanner(e) {
  if (48 <= e.keyCode && e.keyCode <= 57) {
    barcode += e.key;
  }

  if (barcode.length === 15) {
    IMEIcodes.push(barcode);
    document.getElementsByTagName('tbody')[0].innerHTML += '<tr id="IMEI-'
      .concat(IMEIcodes.length, '"><th scope="row">')
      .concat(IMEIcodes.length, '</th><td>')
      .concat(barcode, '</td><td></td><td></td></tr>');
    barcode = '';
  }
}
/* =========================================================== DyMo Printer =============================================================== */

if (window.addEventListener) window.addEventListener('load', initDymo, false);
else if (window.attachEvent) window.attachEvent('onload', initDymo);
else window.onload = initDymo;

function initDymo() {
  dymoLog('Dymo Version: ' + dymo.label.framework.VERSION);
  labelFileLoadElement.addEventListener('change', loadDymoLabel);

  if (dymo.label.framework.init) {
    dymo.label.framework.init(loadDymoPrinter);
  } else {
    loadDymoPrinter();
  }
}

function loadDymoPrinter() {
  var printers = dymo.label.framework.getPrinters();

  if (printers.length == 0) {
    dymoLog('No DYMO printers are installed.');
    return;
  }

  printersSelect.innerHTML = '';

  for (var i = 0; i < printers.length; i++) {
    var printerName = printers[i].name;
    var option = document.createElement('option');
    option.value = printerName;
    option.appendChild(document.createTextNode(printerName));
    printersSelect.appendChild(option);
  }
}

function loadDymoLabel(event) {
  try {
    var reader = new FileReader();

    reader.onload = function () {
      dymoLabel = dymo.label.framework.openLabelXml(reader.result);
    };

    document.getElementById('file-input-name-label').innerText = event.target.files[0].name;
    reader.readAsText(event.target.files[0]);
  } catch (e) {
    console.log(e);
  }
}

function startPrint() {
  try {
    while (loop) {
      if (imeiIndex < IMEIcodes.length) {
        var code = IMEIcodes[imeiIndex];
        dymoLabel.setObjectText('IMEI_QRCODE', code);
        dymoLabel.setObjectText('IMEI_NUMER', code);
        var paramsXml = {};
        if (printersSelect.value.match(/tape/gi)) {
          paramsXml = dymo.label.framework.createTapePrintParamsXml({
            copies: printCount,
            flowDirection: dymo.label.framework.FlowDirection.LeftToRight,
            alignment: dymo.label.framework.TapeAlignment.Center,
            cutMode: dymo.label.framework.TapeCutMode.AutoCut,
          });
        } else {
          paramsXml = dymo.label.framework.createLabelWriterPrintParamsXml({
            copies: printCount,
            printQuality: dymo.label.framework.LabelWriterPrintQuality.Auto,
            flowDirection: dymo.label.framework.FlowDirection.LeftToRight,
            twinTurboRoll: dymo.label.framework.TwinTurboRoll.Auto,
          });
        }

        dymo.label.framework.printLabel(printersSelect.value, paramsXml, dymoLabel.getLabelXml());
        var tableRow = document.getElementById('IMEI-'.concat(imeiIndex + 1)).children;
        tableRow[2].innerText = printCount;
        tableRow[3].innerHTML = '<img src="assets/image/correct.svg" width="20px">';
        imeiIndex++;
      } else {
        stopPrinting();
        break;
      }
    }
  } catch (e) {
    console.log(e);
    dymoLog(e.message);
  }
}

function startPrinting() {
  if (!loop) {
    if (dymoLabel !== null) {
      if (imeiIndex < IMEIcodes.length) {
        loop = true;
        document.getElementById('start-printing-btn').classList.add('active');
        document.getElementById('stop-printing-btn').classList.remove('active');
        startPrint();
      } else {
        alert('Scan some bracode before printing');
      }
    } else {
      alert('Please select a dymo label file');
    }
  }
}

function stopPrinting() {
  if (loop) {
    loop = false;
    document.getElementById('start-printing-btn').classList.remove('active');
    document.getElementById('stop-printing-btn').classList.add('active');
  }
}

function dymoLog(message) {
  if (message) {
    dymoLogScreen.innerHTML += '<p class="card-text">'.concat(message, '</p>');
  }
}
