// [example]
// pack example
//wasmpack('wa/add.wasm', 0xBD);
//wasmpack('wa/fac.wasm', 0xAA);

// unpack example
let main_wasm = wasmunpack('wa/add.wasp', 0xBD);
wasmexec(main_wasm, aa);
wasmexec(main_wasm, a);
let fact_wasm = wasmunpack('wa/fac.wasp', 0xAA);
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
// pack wrapper
function wasmpack(filename, keyvalue) {
    fetch(filename).then(res => {
        let promise = res.body.getReader().read();
        promise.then(res => pack(res, keyvalue))
        .then(save); // (optional) for saving packed file
    });
}

// unpack wrapper
async function wasmunpack(filename, keyvalue) {
    let res = await fetch(filename); // fetch(filename) -> [Response Promise] -> await -> res
    let res2 = await res.body.getReader().read(); // [Promise] res.body.getReader().read() -> await -> res2
    let res3 = await unpack(res2, keyvalue); // [Promise] res2=unpack(res2, keyvalue) -> await -> res3
    let res4 = await instantiate(res3); // [Promise] res3=instantiate(res3) -> await -> res4:WebAssembly.instantiateStreaming(moduleResponse)
    return res4;

    // fetch(filename).then(res => {
    //     let promise = res.body.getReader().read();
    //     promise.then(res => unpack(res, keyvalue)).then(res => execute(res, func));
    // });
}

// pack
function pack(s, k) {
    let c = s.value;
    for (let i = 0; i < c.length; i++) {
        c[i] ^= k;
    }
    return s;
}

// unpack
function unpack(s, k) {
    let c = s.value;
    for (let i = 0; i < c.length; i++) {
        c[i] ^= k;
    }
    return s;
}

// [subAPI]
// make a link to download a wasm file in web
function save(c) {
    let file = new Blob([c.value], {type: 'application/wasm'});
    var url = URL.createObjectURL(file);
    var link = document.getElementById('link');
    link.href = url;
    link.download = 'main.wasp';
}

// instantiate a wasm file
function instantiate(s) {
    let r = new Blob([s.value], {type: 'application/wasm'});
    let moduleResponse = new Response(r, {'headers': {'Content-Type': 'application/wasm'}});
    return WebAssembly.instantiateStreaming(moduleResponse);
}

// run a wasm file with given function name f
function wasmexec(s, f) {
    s.then(obj => f(obj.instance.exports));
}