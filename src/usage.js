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
//wasmpackFetch('wa/add.wasm', 0xBD);
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