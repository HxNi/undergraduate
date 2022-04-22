// WASP
// [1] WASP Input example
// upload_file input tag
// upload original .wasm file to pack
document.getElementById('upload_file').addEventListener('input', function() {
    // if file exists in the input
    if (this.files.length == 1) {
        WASP.wasmpackInput(this.files[0], 'xor', 0xBD, makeSavelinkInput);
    }
});

// load packed .wasp file to unpack
let load_wasm;
document.getElementById('load_file').addEventListener('input', async function() {
    // if file exists in the input
    if (this.files.length == 1) {
        let load = await WASP.wasmunpackInput(this.files[0], 'xor', 0xAA);
        let filename = this.files[0].name.substring(0, this.files[0].name.lastIndexOf("."));
        document.getElementById('div_call').removeAttribute('hidden');
        document.getElementById('run_file').innerText = "call the function in " + filename + ".wasm";
        document.getElementById('run_file').style.color = "blue";
        load_wasm = WASU.wasmload(load);
        
        // wasmexec(load_wasm, function a(obj) {
        //     console.log(obj.addTwo(10, 20));
        // });
    }
});

// run unpacked .wasm file with function call given in the box
document.getElementById('run_file').addEventListener('click', function() {
    if (load_wasm != null) {
        document.getElementById('run_file').style.color = "blue";
        document.getElementById('result').innerText = "";

        let call_statement = document.getElementById('call').value.replace(/\s+/g, '');
        let function_name = call_statement.substring(0, call_statement.lastIndexOf('('));
        let param = call_statement.substring(call_statement.lastIndexOf('(') + 1, call_statement.lastIndexOf(')'));
        param = param.split(",")
        param = param.map(a => Number(a));
        WASU.wasmexec(load_wasm, function_name, [...param], (result) => {document.getElementById('result').innerText = result;});
    }
});

// [2] WASP Fetch example
// pack example
WASP.wasmpackFetch('wa/add.wasm', 'xor', 0xBD, makeSavelinkFetch);
WASP.wasmpackFetch('wa/fac.wasm', 'xor', 0xAA, makeSavelinkFetch);

// unpack example
let main_wasm = WASP.wasmunpackFetch('wa/add.wasp', 'xor', 0xBD);
WASU.wasmexec(main_wasm, 'addTwo', [10, 20], showResult);
WASU.wasmexec(main_wasm, 'addTwo', [10, 23], showResult);
let fact_wasm = WASP.wasmunpackFetch('wa/fac.wasp', 'xor', 0xAA);
WASU.wasmexec(fact_wasm, 'fac', [2], showResult);


// WASO
// [3] WASO Input example
document.getElementById('obf_upload_file').addEventListener('input', function() {
    // if file exists in the input
    if (this.files.length == 1) {
        WASO.wasmobfInput(this.files[0], makeSavelinkInput);
    }
});

// [4] WASO Fetch example
WASO.wasmobfFetch('wa/test1.wasm', 'hash', makeSavelinkWASOFetch);
let obf_wasm = WASP.wasmunpackFetch('wa/test1_obf.wasm');
WASO.wasmexec(obf_wasm, 'addThree', [1, 2, 3], 'hash', showResultWASO);



// make a link to download a wasm file in web
function makeSavelinkInput(c, filename) {
    var link = document.getElementById('download_file');
    link.innerText = filename + '.wasp download';
    if (typeof WASU != 'undefined') link.href = WASU.makeURL(c, filename);
    else console.log("import WASU");
    link.download = filename + '.wasp';
}

function makeSavelinkFetch(c, filename) {
    var link = document.createElement('a');
    link.innerText = filename + '.wasp download'; 
    if (typeof WASU != 'undefined') link.href = WASU.makeURL(c, filename);
    else console.log("import WASU");
    link.download = filename + '.wasp';
    document.getElementById('fetch_download_file').appendChild(link);
    document.getElementById('fetch_download_file').innerHTML += " ";
}

function showResult(result) {
    var span = document.createElement('span');
    span.innerText = result; 
    document.getElementById('div_fetch_call').appendChild(span);
    document.getElementById('div_fetch_call').innerHTML += " ";
}

function makeSavelinkWASOFetch(c, filename) {
    var link = document.createElement('a');
    link.innerText = filename + '_obf.wasm download'; 
    if (typeof WASU != 'undefined') link.href = WASU.makeURL(c, filename);
    else console.log("import WASU");
    link.download = filename + '_obf.wasm';
    document.getElementById('WASO_fetch_download_file').appendChild(link);
    document.getElementById('WASO_fetch_download_file').innerHTML += " ";
}

function showResultWASO(result) {
    var span = document.createElement('span');
    span.innerText = result; 
    document.getElementById('div_fetch_call_WASO').appendChild(span);
    document.getElementById('div_fetch_call_WASO').innerHTML += " ";
}