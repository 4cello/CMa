
InstructionDescriptions["print"] = {
		"name": "print",
		"semantics": "print S[SP]; SP ← SP - 1",
		"description": "Prints the value on the stack at the stack pointer (SP) to the standard output. If the value is a float the " +
				"output value will be formatted with a decimal point (even if it is a whole number). The stack pointer is then " +
				"decremented by one."
}

function print(inst,vm){
	// send the value on top of the stack to std out
	var a = vm.pop();
	vm.print(a);
	
}

