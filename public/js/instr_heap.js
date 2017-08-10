
InstructionDescriptions["_new"] = {
		"name": "print",
		"semantics": "S[SP] ← A Mark free cells A, A..., A + S[SP] - 1 as allocated",
		"description": "Allocates memory from the heap size of value on the stack."
}

function _new(inst,vm){
	// send the value on top of the stack to std out
	var A = vm.pop();

	var hp = vm.HP;
	var np = vm.HP - A;
	
	if( hp< vm.EP ) {
		throw "Out of memory error.  Attempt to allocate memory from heap; EP=" + vm.EP + " HP=" + vm.HP + ".";
	}
	
	vm.HP = np;
	vm.push( new Value("ptr", hp) );
	
	
}

