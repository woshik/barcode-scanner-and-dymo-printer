'use strict';

var IMEIcodes = [],
  barcode = '',
  startAndStopProcessDOMElement,
  printCount = 1,
  checkClickButton = 2,
  dymoLogScreen,
  dymoLabel,
  loop = false,
  imeiIndex = 0,
  printersSelect;

window.addEventListener('DOMContentLoaded', function () {
  printersSelect = document.getElementById('printersSelect');
  dymoLogScreen = document.getElementById('dymo-log-screen');
  startAndStopProcessDOMElement = document.querySelectorAll('#stop-start-process button');
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
    document.getElementsByTagName('tbody')[0].innerHTML += `
      <tr id="IMEI-${IMEIcodes.length}">
        <th scope="row">${IMEIcodes.length}</th>
        <td>${barcode}</td>
        <td></td>
        <td></td>
      </tr>
    `;
    barcode = '';
  }
}

/* =========================================================== DyMo Printer =============================================================== */

// register onload event
if (window.addEventListener) window.addEventListener('load', initDymo, false);
else if (window.attachEvent) window.attachEvent('onload', initDymo);
else window.onload = initDymo;

function initDymo() {
  dymoLog('Dymo Version: ' + dymo.label.framework.VERSION);
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

  for (var i = 0; i < printers.length; i++) {
    var printerName = printers[i].name;

    var option = document.createElement('option');
    option.value = printerName;
    option.appendChild(document.createTextNode(printerName));
    printersSelect.appendChild(option);
  }

  loadDymoLabel();
}

function loadDymoLabel() {
  try {
    var currentLoc = window.location.pathname;
    var currentDir = currentLoc.substring(0, currentLoc.lastIndexOf('/'));
    var labelDir = "/assets/layouts/LabelLayout.label";
    var labelUri = "file:///" + currentDir + labelDir;
    dymoLabel = dymo.label.framework.openLabelFile(labelUri);
  } catch (e) {
    dymoLog(e.message || e);
  }
}

async function startPrint() {
  try {
    while (loop) {
      if (imeiIndex < IMEIcodes.length) {
        let code = IMEIcodes[imeiIndex];
        dymoLabel.setObjectText('IMEI_QRCODE', code);
        dymoLabel.setObjectText('IMEI_NUMER', code);

        var paramsXml = dymo.label.framework.createLabelWriterPrintParamsXml({
          copies: printCount,
          printQuality: dymo.label.framework.LabelWriterPrintQuality.Auto,
        });

        dymo.label.framework.printLabel(printersSelect.value, paramsXml, dymoLabel.getLabelXml());

        var tableRow = document.getElementById(`IMEI-${imeiIndex + 1}`).children;

        tableRow[2].innerText = printCount;
        tableRow[3].innerHTML = `<img src="assets/image/correct.svg" width="20px">`;

        imeiIndex++;
      } else {
        break;
      }
    }
  } catch (e) {
    dymoLog(e.message || e);
  }
}

document.getElementById('startPrintBtn').addEventListener('click', (e) => {
  if (loop !== true) {
    loop = true;
    e.target.classList.add('active');
    e.target.parentElement.children[1].classList.remove('active');
    startPrint();
  }
});

document.getElementById('stopStopBtn').addEventListener('click', (e) => {
  if (loop !== false) {
    e.target.classList.add('active');
    e.target.parentElement.children[0].classList.remove('active');
    loop = false;
  }
});

function dymoLog(message) {
  if (message) {
    dymoLogScreen.innerHTML += `<p class="card-text">${message}</p>`;
  }
}
