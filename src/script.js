// [example]
// upload original .wasm file to pack
document.getElementById('upload_file').addEventListener('input', function() {
    let link = document.getElementById('upload_file');
    if (link.files.length == 1) {
        wasmpack(link.files[0], 0xBD);
    }
});

// load packed .wasp file to unpack
let load_wasm;
document.getElementById('load_file').addEventListener('input', async function() {
    let link = document.getElementById('load_file');
    if (link.files.length == 1) {
        let load = await wasmunpack(link.files[0], 0xBD);
        load_wasm = wasmload(load);
        
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
        wasmexec(load_wasm, function a(obj) {
            let fn = obj[function_name];
            let result = fn(...param);
            document.getElementById('result').innerText = result;
        });
    }
})

// [example]
// pack example
wasmpackFetch('wa/add.wasm', 0xBD);
//wasmpackFetch('wa/fac.wasm', 0xAA);

// unpack example
let main_wasm = wasmunpackFetch('wa/add.wasp', 0xBD);
wasmexec(main_wasm, aa);
wasmexec(main_wasm, a);
let fact_wasm = wasmunpackFetch('wa/fac.wasp', 0xAA);
wasmexec(fact_wasm, b);

function a(obj){
    console.log(obj.addTwo(10, 20));
}

function aa(obj){
    console.log(obj.addTwo(10, 23));
}

function b(obj){
    console.log(obj.fac(2)); 
}

// [pack/unpack API]
// pack wrapper from remote input
function wasmpack(file, keyvalue) {
    let reader = new FileReader();
    let filename = file.name.substring(0, file.name.lastIndexOf("."));
    reader.onload = function() {
        let contents = new Uint8Array(reader.result);
        //contents = new TextEncoder("utf-8").encode(contents);
        pack(contents, keyvalue);
        save(contents, filename);
    };
    reader.readAsArrayBuffer(file);
}

function wasmpackFetch(filepath, keyvalue) {
    let filename = filepath.substring(filepath.lastIndexOf("/") + 1, filepath.lastIndexOf("."));
    fetch(filepath).then(res => {
        let promise = res.body.getReader().read();
        promise.then(res => packFetch(res, keyvalue))
        .then(res => saveFetch(res, filename)); // (optional) for saving packed file
    });
}

// unpack wrapper
function wasmunpack(file, keyvalue) {
    let reader = new FileReader();
    let trigger = false;
    let filename = file.name.substring(0, file.name.lastIndexOf("."));
    let promise = new Promise(function(res) {
        reader.onload = function() {
            let contents = new Uint8Array(reader.result);
            unpack(contents, keyvalue);
            res(contents);
        }
    });
    reader.readAsArrayBuffer(file);

    document.getElementById('div_call').removeAttribute('hidden');
    document.getElementById('run_file').innerText = "run " + filename + ".wasm";
    document.getElementById('run_file').style.color = "blue";
    return promise;
}
async function wasmunpackFetch(filename, keyvalue) {
    let res = await fetch(filename); // fetch(filename) -> [Response Promise] -> await -> res
    let res2 = await res.body.getReader().read(); // [Promise] res.body.getReader().read() -> await -> res2
    let res3 = await unpackFetch(res2, keyvalue); // [Promise] res2=unpack(res2, keyvalue) -> await -> res3
    let res4 = await wasmloadFetch(res3); // [Promise] res3=instantiate(res3) -> await -> res4:WebAssembly.instantiateStreaming(moduleResponse)
    return res4;

    // fetch(filename).then(res => {
    //     let promise = res.body.getReader().read();
    //     promise.then(res => unpack(res, keyvalue)).then(res => execute(res, func));
    // });
}

// pack
function pack(c, k) {
    for (let i = 0; i < c.length; i++) {
        c[i] ^= k;
    }
}

function packFetch(s, k) {
    let c = s.value;
    for (let i = 0; i < c.length; i++) {
        c[i] ^= k;
    }
    return s;
}

// unpack
function unpack(c, k) {
    for (let i = 0; i < c.length; i++) {
        c[i] ^= k;
    }
    return c;
}

function unpackFetch(s, k) {
    let c = s.value;
    for (let i = 0; i < c.length; i++) {
        c[i] ^= k;
    }
    return s;
}

// [subAPI]
// make a link to download a wasm file in web
function save(c, filename) {
    let file = new Blob([c], {type: 'application/wasm'});
    var url = URL.createObjectURL(file);
    var link = document.getElementById('download_file');
    link.innerText = filename + '.wasp download'; 
    link.href = url;
    link.download = filename + '.wasp';
}

function saveFetch(c, filename) {
    let file = new Blob([c.value], {type: 'application/wasm'});
    var url = URL.createObjectURL(file);
    var link = document.getElementById('download_file');
    link.innerText = filename + '.wasp download'; 
    link.href = url;
    link.download = filename + '.wasp';
}

function wasmload(file) {
    let r = new Blob([file], {type: 'application/wasm'});
    let moduleResponse = new Response(r, {'headers': {'Content-Type': 'application/wasm'}});
    let module = WebAssembly.instantiateStreaming(moduleResponse);

    return module;
}

// instantiate a wasm file
function wasmloadFetch(s) {
    let r = new Blob([s.value], {type: 'application/wasm'});
    let moduleResponse = new Response(r, {'headers': {'Content-Type': 'application/wasm'}});
    return WebAssembly.instantiateStreaming(moduleResponse);
}

// run a wasm file with given function name f
function wasmexec(s, f) {
    s.then(obj => f(obj.instance.exports));
}