// globals

var InstructionDefinition = {};

class Instruction {
	
	constructor( def, arg1, arg2, label, comment ) {
		this.def = def;
		this._arg1 = arg1;
		this._arg2 = arg2;
		this._label = label;
		this.breakpoint = false;
		this._comment = comment;
	};
	
	toString(){
		var str =  this.def.name;
		if( this.argument ) {
			str += " " + this.argument.toString();
		} 
		return str;
	};
	
	get label(){
		if( this._label ) {
			return this._label;
		};
		return "";
	}
	
	get arg1(){
		if( this._arg1 ) {
			return this._arg1;
		};
		return "";
	}
	
	get arg2(){
		if( this._arg2 ) {
			return this._arg2;
		};
		return "";
	}
	
	get name(){
		return this.def.name;
	}
	
	get comment(){
		if( this._comment ) {
			return this._comment;
		};
		return "";
	}

	toFormattedString(){
		if( this.def ) {
			var str =  '<b>' + this.def.name + '</b>';
			if( this._arg1 ) {
				if( this._arg1.type=="label" ) {
					str += " <i>" + this._arg1.toString() + "</i>";
				} else {
					str += " " + this._arg1.toString();
				}
			};
			
			if( this._arg2 ) {
				if( this._arg2.type=="label" ) {
					str += " <i>" + this._arg2.toString() + "</i>";
				} else {
					str += " " + this._arg2.toString();
				}
			};
			
			return str;
		}
		
		return "-";
		
	};
	
	// returns the argument value as an int, thows error if it is not.
	argument1AsInt(){
		if( this._arg1.type == "int" || this._arg1.type == "ptr" ) {
			return this._arg1.value;
		} else {
			throw 'Error: Argument for instruction ' + this.def.name 
					+ ' must be an int or a ptr, not ' + this._arg1.type + '.';
		}
			
	}

	// returns the argument value as an int or ptr 
	argument1AsPtr(){
		if( this._arg1.type == "int" || this._arg1.type == "ptr" ) {
			return this.arg1.value;
		} else {
			throw 'Error: Argument for instruction ' + this.def.name 
					+ ' must be an int or a ptr, not ' + this._arg1.type + '.';
		}
			
	}

	// returns the argument value as an int, thows error if it is not.
	argument2AsInt(){
		if( this._arg2.type == "int" || this._arg2.type == "ptr" ) {
			return this.arg2.value;
		} else {
			throw 'Error: Argument for instruction ' + this.def.name 
					+ ' must be an int or a ptr, not ' + this._arg2.type + '.';
		}
			
	}

	toggleBreakpoint(){
		this.breakpoint = !this.breakpoint;
		return this.breakpoint;
	}
	
};

class Value {
	constructor( type, value ){
		this.type = type;
		this.value = value;
	}
	
	asIntOrPtr(){
		if( this.type == "int" || this.type == "ptr" ) {
			return this.value;
		} else {
			throw 'Error: Value expected to be an int or ptr, not ' + this.argument.type + '.';
		}
	}
	
	toString(){
		
		var str = "";
		if( this.type=="int" ){
			str += this.value;
		} else if( this.type=="float" ){
			if( this.value % 1 ){				
				str += this.value;
			} else {
				str += this.value + ".0"; 
			}
		} else if( this.type=="ptr" ) {
			str += this.value;
		} else if( this.type=="label" ) {
			str += this.value;
		} else {
			str += "UNKNOWN";
		}
		return str;
	}
	
};

const NULL_VALUE = new Value("int", 0 );
const NOP = new Instruction(null,null,null);
const TRUE = new Value("int", 1 );
const FALSE = new Value("int", 0 );


class VirtualMachine {

	constructor( ProgramStoreSize, MainMemorySize, MaxStackSize ){
		this.MAIN_MEMORY_SIZE = MainMemorySize;
		this.PROGRAM_STORE_SIZE = ProgramStoreSize;
		this.MAX_STACK_SIZE = MaxStackSize;
		
		this.C = [];  // Program Store
		
		for(var i=0; i<this.PROGRAM_STORE_SIZE; i++) {
			this.C.push(NOP);
		}
		
		this.running = false;
		this.restart();
		this.memory = null;
	}
	
	get HeapSize(){
		return this.MAIN_MEMORY_SIZE-this.MAX_STACKSIZE+1;
	}
	
	get currentInstruction(){
		return this.C[this.PC];
	}

	isRunning() {
		return this.running;
	}
	
	isNextInstructionBreakpoint() {
		var instr = this.C[this.PC];
		return instr.breakpoint;
	}
	
	executeNextInstruction() {
		
		if( this.running) {

			// get next instruction, invoke implementation with a reference to the instr and vm
			var instr = this.C[this.PC];
			
			this.PC++;

			// perform the instruction
			instr.def.impl( instr, this );

		} 
		
	}
	
	restart(){
		this.PC = 0;
		this.FP = 0;
		this.SP = -1;
		this.EP = this.MAX_STACK_SIZE;
		this.HP = this.MAIN_MEMORY_SIZE;
		
		this.out = "";
		this.err = "";
		this.running = true;
		
		this.S = [];  
		
		for(var i=0; i<this.MAIN_MEMORY_SIZE; i++){
			this.S[i] = NULL_VALUE;
		}

		if( this.memory ) {
			// now update main memory with the supplied values
			for( var i=0; i<this.memory.length; i++ ) {
				var v = this.memory[i];
				this.S[v.address] = v.value;
			}	
		}
		
	}
	
	loadProgram( program, memory ) {
		this.memory = memory;
		
		for( var i=0; i <program.length; i++ ){
			var instr = program[i];
			this.C[i] = instr;
		}
		for( var i=program.length; i<this.PROGRAM_STORE_SIZE; i++){
			this.C[i] = NOP;
		} 
		
		restart();
		
	}
	
	getSource(){
		return serializeProgram(this.C);
	}
	
	pop() {
		if( this.SP < 0 ) {
			throw "Stack underflow.  Attempt to pop on empty stack.";
		}
		var v = this.S[this.SP];
		this.SP--;
		return v;
	}

	peek() {
		if( this.SP < 0 ) {
			throw "Stack underflow.  Attempt to pop on empty stack.";
		}
		var v = this.S[this.SP];
		return v;
	}

	push(value) {
		if( this.SP >= this.EP ) {
			throw "Stack overflow.  Attempt to push on full stack.";
		}
		this.SP++;
		this.S[this.SP] = value;
	}
	
	print( value ) {
		this.out += value.toString();
	}
	
	eatOutput(){
		var buf = this.out;
		this.out = ""
		return buf;
	}

	halt(){
		this.running = false;
		this.out += '\nMachine halted';	
	}
	
	getAddressFromArgument(arg){
		if( arg.type=="ptr" ) {
			for(var i=0; i<this.PROGRAM_STORE_SIZE; i++) {
				var instr = this.C[i];
				if( arg.value == instr.label ){
					return i;
				}
			}
		} else if( arg.type=="int" ){
			return arg.value;
		}
		throw "Error: unable to convert argument to physical address.";
	}
	
}

