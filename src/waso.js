let WASO = {};

// [obfuscate/deobfuscate API]

WASO.wasmobfInput = function (file, afterAction=null) {
    let reader = new FileReader();
    let filename = WASO.getFilenameFromInput(file);
    reader.onload = function() {
        let contents = new Uint8Array(reader.result);
        WASO.wasmobf(contents);
        if (afterAction != null) afterAction(contents, filename);
    }
    reader.readAsArrayBuffer(file);
};

WASO.wasmobfFetch = function (file, afterAction=null) {
    let filename = WASO.getFilenameFromFetch(file);
    fetch(file).then(res => {
        if (afterAction != null)
            res.body.getReader().read()
            .then(res => WASO.wasmobf(res.value))
            .then(res => afterAction(res, filename));
        else
            res.body.getReader().read()
            .then(res => WASO.wasmobf(res.value));
    });
};

WASO.wasmobf = function (contents) {
    // check wasm magic number
    if (!(new Uint8Array([0x00, 0x61, 0x73, 0x6d]).every((value, index) => value == contents[index]))) return;
    // check wasm version is 1
    if (!(new Uint8Array([0x01, 0x00, 0x00, 0x00]).every((value, index) => value == contents[index+4]))) return;
    let offset = 8;
    let found = false;
    while (offset < contents.length) {
        // check section code is Export section(0x07)
        if (contents[offset] == 0x07) {
            found = true;
            break;
        }
        // 2 = 1 for section code space + 1 for section length space
        offset += contents[offset+1] + 2;
    }
    if (!found) return;
    let sectionSize = contents[offset + 1];
    let numExports = contents[offset + 2];
    let exportSectionOffset = offset + 3;
    let exportOffset = exportSectionOffset;
    let newExportSection = [];
    for (let i = 0; i < numExports; i++) {
        let nameSize = contents[exportOffset];
        let exportKind = contents[exportOffset+nameSize+1]; // 1 for name length space
        let exportFunctionIndex = contents[exportOffset+nameSize+2] // 1 for name length space + 1 for export kind

        let name = contents.slice((exportOffset+1), (exportOffset+1)+nameSize);
        let nameString = WASO.convertArrayToString(name);
        let obfnameString = WASO.wasmobfName(nameString).slice(0, 8);
        let obfname = WASO.convertStringToArray(obfnameString);
        newExportSection.push(obfname.length);
        newExportSection.push(...obfname);
        newExportSection.push(exportKind);
        newExportSection.push(exportFunctionIndex);
        console.log(newExportSection);
        // 3 = 1 for name length space + 1 for export kind + 1 for export function index 
        exportOffset += nameSize + 3;
    }
    newExportSection.unshift(numExports);
    newExportSection.unshift(newExportSection.length);
    newExportSection.unshift(0x07);
    let newWasm = [...contents.slice(0, offset), ...newExportSection, ...contents.slice(offset + 2 + sectionSize)];

    return new Uint8Array(newWasm);
};

WASO.wasmobfName = function (str, mode='hash') {
    if (mode == 'hash') {
        if (typeof CryptoJS == null) {
            console.log("import CryptoJS");
            return;
        }
        let hash = CryptoJS.SHA256(str).toString();
        return hash;
        // use Crypto module for Node.js
    }
};

// [get filename API]
WASO.getFilenameFromInput = function (file) {
    return file.name.substring(0, file.name.lastIndexOf("."));
}

WASO.getFilenameFromFetch = function (file) {
    return file.substring(file.lastIndexOf("/") + 1, file.lastIndexOf("."));
}

WASO.convertArrayToString = function (arr) {
    return String.fromCharCode(...arr);
}

WASO.convertStringToArray = function (str) {
    var result = [];
    for (var i = 0; i < str.length; i++) {
      result.push(str.charCodeAt(i));
    }
    return result;
  }