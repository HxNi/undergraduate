let WASO = {};

// [obfuscate/deobfuscate API]

WASO.wasmobfInput = function (file, mode, afterAction=null) {
    let reader = new FileReader();
    let filename = WASU.getFilenameFromInput(file);
    reader.onload = function() {
        let contents = new Uint8Array(reader.result);
        WASO.wasmobf(contents, mode);
        if (afterAction != null) afterAction(contents, filename);
    }
    reader.readAsArrayBuffer(file);
};

WASO.wasmobfFetch = function (file, mode, afterAction=null) {
    let filename = WASU.getFilenameFromFetch(file);
    fetch(file).then(res => {
        if (afterAction != null)
            res.body.getReader().read()
            .then(res => WASO.wasmobf(res.value, mode))
            .then(res => afterAction(res, filename));
        else
            res.body.getReader().read()
            .then(res => WASO.wasmobf(res.value, mode));
    });
};

WASO.wasmobf = function (contents, mode) {
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
        let nameString = WASU.convertArrayToString(name);
        let obfnameString = WASO.wasmobfName(nameString, mode);
        let obfname = WASU.convertStringToArray(obfnameString);
        newExportSection.push(obfname.length);
        newExportSection.push(...obfname);
        newExportSection.push(exportKind);
        newExportSection.push(exportFunctionIndex);

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
        return hash.slice(0, 8);
        // use Crypto module for Node.js
    }
};

WASO.wasmFetch = async function (filename, keyvalue) {
    let res = await fetch(filename); // fetch(filename) -> [Response Promise] -> await -> res
    let res2 = await res.body.getReader().read(); // [Promise] res.body.getReader().read() -> await -> res2
    let res3 = await WASO.wasmload(res2.value); // [Promise] res3=instantiate(res3) -> await -> res4:WebAssembly.instantiateStreaming(moduleResponse)
    return res3;

    // *PREVIOUS CODE*
    // fetch(filename).then(res => {
    //     let promise = res.body.getReader().read();
    //     promise.then(res => unpack(res, keyvalue)).then(res => execute(res, func));
    // });
};

WASO.wasmdeobf = function (str, mode='hash') {
    if (mode == 'hash') {
        return WASO.wasmobfName(str, 'hash');
    }
};

// [util API]
// [load/execute API]
// instantiate a wasm file
WASO.wasmload = function (file) {
    let r = new Blob([file], {type: 'application/wasm'});
    let moduleResponse = new Response(r, {'headers': {'Content-Type': 'application/wasm'}});
    return WebAssembly.instantiateStreaming(moduleResponse);
};

// run a wasm file with given function name f
WASO.wasmexec = function (s, f, a, mode, afterAction=null) {
    s.then(obj => {
        let result;
        result = obj.instance.exports[WASO.wasmdeobf(f, mode)](...a);
        if (afterAction != null) afterAction(result);
    });
};
