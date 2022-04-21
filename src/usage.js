// WASP
// [Input example]
// upload_file input tag
// upload original .wasm file to pack
document.getElementById('upload_file').addEventListener('input', function() {
    // if file exists in the input
    if (this.files.length == 1) {
        WASP.wasmpackInput(this.files[0], 0xBD, makeSavelinkInput);
    }
});

// load packed .wasp file to unpack
let load_wasm;
document.getElementById('load_file').addEventListener('input', async function() {
    // if file exists in the input
    if (this.files.length == 1) {
        let load = await WASP.wasmunpack(this.files[0], 0xAA);
        let filename = this.files[0].name.substring(0, this.files[0].name.lastIndexOf("."));
        document.getElementById('div_call').removeAttribute('hidden');
        document.getElementById('run_file').innerText = "call the function in " + filename + ".wasm";
        document.getElementById('run_file').style.color = "blue";
        load_wasm = WASP.wasmload(load);
        
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
        WASP.wasmexec(load_wasm, function a(obj) {
            let fn = obj[function_name];
            let result = fn(...param);
            document.getElementById('result').innerText = result;
        });
    }
});

// [Fetch example]
// pack example
WASP.wasmpackFetch('wa/add.wasm', 0xBD, makeSavelinkFetch);
WASP.wasmpackFetch('wa/fac.wasm', 0xAA, makeSavelinkFetch);

// unpack example
let main_wasm = WASP.wasmunpackFetch('wa/add.wasp', 0xBD);
WASP.wasmexec(main_wasm, (obj) => {return obj.addTwo(10, 20);}, showResult);
WASP.wasmexec(main_wasm, (obj) => {return obj.addTwo(10, 23);}, showResult);
let fact_wasm = WASP.wasmunpackFetch('wa/fac.wasp', 0xAA);
WASP.wasmexec(fact_wasm, (obj) => {return obj.fac(2);}, showResult);


// WASO
document.getElementById('obf_upload_file').addEventListener('input', function() {
    // if file exists in the input
    if (this.files.length == 1) {
        WASO.wasmobfInput(this.files[0], makeSavelinkInput);
    }
});

WASO.wasmobfFetch('wa/test1.wasm', makeSavelinkWASOFetch);




// make a link to download a wasm file in web
function makeSavelinkInput(c, filename) {
    var link = document.getElementById('download_file');
    link.innerText = filename + '.wasp download';
    if (typeof WASP != 'undefined') link.href = WASP.makeURL(c, filename);
    else if (typeof WASO != 'undefined') link.href = WASO.makeURL(c, filename);
    else console.log("import WASP or WASO");
    link.download = filename + '.wasp';
}

function makeSavelinkFetch(c, filename) {
    var link = document.createElement('a');
    link.innerText = filename + '.wasp download'; 
    if (typeof WASP != 'undefined') link.href = WASP.makeURL(c, filename);
    else if (typeof WASO != 'undefined') link.href = WASO.makeURL(c, filename);
    else console.log("import WASP or WASO");
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
    if (typeof WASP != 'undefined') link.href = WASP.makeURL(c, filename);
    else if (typeof WASO != 'undefined') link.href = WASO.makeURL(c, filename);
    else console.log("import WASP or WASO");
    link.download = filename + '_obf.wasm';
    document.getElementById('WASO_fetch_download_file').appendChild(link);
    document.getElementById('WASO_fetch_download_file').innerHTML += " ";
}