/*************************************************************
 *
 *  MathJax/extensions/jax2MathSpeak.js
 *  
 *  Implements Jax to MathSpeak
 *
 */

//TODO: handle mi mathvariants and still account for every possible char
/*In the distance formula example for some reason I need to put the mo element inside
		the mrow element. But when I do this mathjax creates another node in the tree
		and the mo element has no previous child. So my code thinks it should be
		interpreted as negative not minus. Not sure how to deal with this yet. I'll need to 
		think a bit about which case I want to mean what. */
//TODO: the mathspeak standard wants to differentiate between subscripts and chemical formulas
		//I don't know how they expect this to be done. how can i know FE(sub2) or O(sub2) is not just
		//some mathematical notation? Even if I store the abbreviations for all the elements this is 
		//difficult.
//TODO: how to deal with nested fractions?
//TODO: how to deal with nested roots?
//TODO: how to deal with cancelled mi's?
//TODO: expand under/over modification specifications
		//TODO: allow for modifiying with varying overscripts
//TODO: unit abbreviations. would units generally be put in <mtext> tags? or <ms> tags? etc?
//TODO: layouts
//TODO: linear alg
//TODO: modifers/ under and overscripts
//TODO: handle multiple exceptions at the same time, ie fractions and superscripts

MathJax.Extension.jax2MathSpeak = {
  config: {
    verbosity: 1,
    verbosity_options: ["verbose","brief","superbrief"]
  },
  
  PreProcess: function (element) {
		if (!this.configured) {
			this.config = MathJax.Hub.CombineConfig("jax2MathSpeak", this.config);
      if (this.config.Augment) {MathJax.Hub.Insert(this,this.config.Augment)}
			this.MathMLMathSpeak.lang = MathJax.Extension[MathJax.Hub.Config.lang];
			this.MathMLMathSpeak.verbosity = this.config.verbosity;
			this.configured = true;
    }
  },
  
	tagStack: [],
	mathSpeakText: "",
	mathSpeakBufferText: "",
	checkException: false,
	isCurrentException: false,
	isCurrentExponentException: false,
	fractionBuffer: {
		numerator: "",
		denominator: ""
	},
	exponentBuffer: {
		baseText: "",
		base: "",
		power: "",
	},

	getMathSpeakText: function() {
		return this.mathSpeakText;
	},

	generateMathSpeak: function(inputJax) {
		this.tagStack = [];
		this.mathSpeakText = "";
		this.mathSpeakBufferText = "";
		if (inputJax.root) {
			var jax = inputJax.root;
			this.processNode(jax);
		} else { console.log("error"); }
	},

	processNode: function(node) {
		if (node.data) {
			var type = node.type;
			
			//console.log("type: " + type + ", currentException: " + this.isCurrentException + ", checkException: " + this.checkException);
			this.mathSpeakBufferText += this.startElement(type);
			this.processElement(type, node);
			
			if (this.checkException == true) {
				if (this.isFractionException()) {
					//console.log("fraction exception");
					this.isCurrentException = true;
					this.mathSpeakText += this.MathMLMathSpeak.lang.fractionException(this.fractionBuffer);
					this.fractionBuffer.numerator = "";
					this.fractionBuffer.denominator = "";
				}
				if (this.isExponentException()) {
					//console.log("exponent exception");
					this.isCurrentException = true;
					this.isCurrentExponentException = true;
					this.checkException = false;
					
					var b = this.exponentBuffer.base;
					var p = this.exponentBuffer.power;
					
					//console.log("pre buffer: " + this.mathSpeakBufferText);
					//need reset because processing entirely again?
					this.mathSpeakBufferText = "";
					this.processNode(b);
					//console.log("post buffer: " + this.mathSpeakBufferText);
					
					//console.log("baseText: " + this.exponentBuffer.baseText);
					this.mathSpeakText += this.exponentBuffer.baseText;
					this.mathSpeakText += this.MathMLMathSpeak.lang.exponentException(p);

					this.exponentBuffer.base = "";
					this.exponentBuffer.power = "";
					this.exponentBuffer.baseText = "";
					this.isCurrentExponentException = false;
				}
			}

			//console.log("isCurrentException: " + this.isCurrentException);

			if (this.isCurrentException == false) {
				this.mathSpeakBufferText += this.endElement();			
				this.mathSpeakText += this.mathSpeakBufferText;
			} else { 
				//console.log("final buffer: " + this.mathSpeakBufferText);
				if (this.isCurrentExponentException == true) {
					//console.log("baseText append: " + this.mathSpeakBufferText);
					this.exponentBuffer.baseText += this.mathSpeakBufferText;
				}
				this.endElement();
			} //needed to end tag and reset isCurrentException

			this.mathSpeakBufferText = "";
		}
	},

	isFractionException: function() {
		var n = this.fractionBuffer.numerator;
		var d = this.fractionBuffer.denominator;
		try {
			d = parseInt(d);
			n = parseInt(n);
		} catch(err) { return false; } //one is not an integer
		if (Math.ceil(n) !== n) { return false; }
		if (Math.ceil(d) !== d) { return false; }
		if (n < 1 || n > 9) { return false; }
		if (d < 2 || d > 99) { return false; }
		//if (n >= d) { return false; }
		return true;
	},

	isExponentException: function() {
		var b = this.exponentBuffer.base;
		var p = this.exponentBuffer.power;
		if (b === "" || p === "") { return false; }	
		try {
			if (p.data.length > 1) { return false; }
			p = parseInt(p.data[0].data[0]);
			if (p !== 2 && p !== 3) { return false; }
		} catch (err) { return false; } //p is not an integer
		return true;
	},

	startElement: function(t) {		
		this.tagStack.push(t);
		if (t === "mfrac" || t === "msup") { this.checkException = true; }
		if (this.MathMLMathSpeak.hasStartHandler(t)) {
			return this.MathMLMathSpeak.startHandler(t);
		} else return "";
	},

	processElement: function(type, node) {
		if (this.MathMLTags.isTokenElement(type)) {
			this.mathSpeakBufferText += this.MathMLMathSpeak.getMathSpeak(type, node);
		} else {
			var children = this.getChildren(node);
			if (type === "mfrac") {
				this.fractionBuffer.numerator = children[0].data[0].data[0];
				this.fractionBuffer.denominator = children[1].data[0].data[0];
			}
			if (type === "msup") {
				this.exponentBuffer.base = children[0]; //.data[0].data[0];
				this.exponentBuffer.power = children[1]; //.data[0].data[0];
			}
			for (var i = 0, l = children.length; i < l; i++) {
				var child = children[i];
				if (i == 0) {this.MathMLMathSpeak.previous = "";}
				if (i > 0) {this.MathMLMathSpeak.previous = children[i-1];}
				if (i == 1 && this.MathMLMathSpeak.hasMiddleHandler(type)) {
					this.mathSpeakBufferText += this.MathMLMathSpeak.middleHandler(type);
				}
				//middle2handler is for the overscripts which have odd text formats
				if (i == 2 && this.MathMLMathSpeak.hasMiddle2Handler(type)) {
					this.mathSpeakBufferText += this.MathMLMathSpeak.middle2Handler(type);
				}
				this.processNode(child);
			}
		}
	},

	endElement: function() {
		var t = this.tagStack.pop();
		if (t === "mfrac" || t === "msup") { this.checkException = false; this.isCurrentException = false; }
		if (this.MathMLMathSpeak.hasEndHandler(t)) {
			return this.MathMLMathSpeak.endHandler(t);
		} else return "";
	},

	hasChildren: function(e) {
		if (!e.data) return false;
		return true;
	},

	getChildren: function(e) {
		if (this.hasChildren(e)) {return e.data;}
	},

	MathMLTags: {
		tokenElements: ["mi", "mn", "mo", "mtext", "mspace", "ms", "mglyph"],
		isTokenElement: function(e) {
			for (var i = 0; i < this.tokenElements.length; i++) {
				if (e === this.tokenElements[i]) {
					return true;
				}
			}
			return false;
		},

		generalLayoutElements: ["mrow", "mfrac", "msqrt", "mroot", "mfenced", "menclose"],
		isGeneralLayoutElement: function(e) {
			for (var i = 0; i < this.generalLayoutElements.length; i++) {
				if (e === this.generalLayoutElements[i]) {
					return true;
				}
			}
			return false;
		},

		scriptLayoutElements: ["msup", "msub", "msubsup", "munder", "mover", "munderover", "mmultiscripts"],
		isScriptLayoutElement: function(e) {
			for (var i = 0; i < this.scriptLayoutElements.length; i++) {
				if (e === this.scriptLayoutElements[i]) {
					return true;
				}
			}
			return false;
		},

		tabularElements: ["mtable", "mtr", "mlabeledtr", "mtd"],
		isTabularElement: function(e) {
			for (var i = 0; i < this.tabularElements.length; i++) {
				if (e === this.tabularElements[i]) {
					return true;
				}
			}
			return false;
		}
	},

	MathMLMathSpeak: {

		previous: "",
		inFunction: false,
		parenCount: 0,
		inAbsVal: false,
		lang: "",
		verbosity: 0,
	
		hasStartHandler: function(t) {
			if (t === "mfrac" || t === "msqrt" || t === "mroot") { return true; }
			if (t === "mover" || t === "munder") { return true; }
			return false;
		},

		startHandler: function(e) {
			if (e === "mfrac") return this.lang.startFrac();
			if (e === "msqrt") return this.lang.startSqrt(this.verbosity);
			if (e === "mroot") return this.lang.startRoot(this.verbosity);
			if (e === "mover") return this.lang.startOverScript(this.verbosity);
			if (e === "munder") return this.lang.startUnderScript(this.verbosity);
			//if (e === "munderover") return this.lang.startUnderOverScript(this.verbosity);
		},

		hasMiddleHandler: function(t) {
			if (t === "mfrac") { return true; }
			if (t === "msub" || t === "msup" || t === "subsuppair") { return true; }
			if (t === "mroot") { return true; }
			if (t === "munderover") { return true; }
			return false;
		},

		middleHandler: function(e) {
			if (e === "mfrac") return this.lang.midFrac();
			if (e === "msup") return this.lang.midSuperscript(this.verbosity);
			if (e === "msub") return this.lang.midSubscript(this.verbosity);
			if (e === "mroot") return this.lang.midRoot(this.verbosity);
			if (e === "munderover") return this.lang.midUnderOverScript(this.verbosity);
		},

		hasMiddle2Handler: function(t) {
			if (t === "munderover") { return true; }
			return false;
		},

		middle2Handler: function(e) {
			if (e === "munderover") return this.lang.mid2UnderOverScript(this.verbosity);
		},

		hasEndHandler: function(t) {
			if (t === "mfrac" || t === "msqrt" || t === "mroot") { return true; }
			if (t === "msub" || t === "msup") { return true; }
			if (t === "mover" || t === "munder" || t === "munderover") { return true; }
			return false;
		},

		endHandler: function(e) {
			if (e === "mfrac") return this.lang.endFrac();
			if (e === "msqrt" || e === "mroot") return this.lang.endRoot();
			if (e === "msub" || e === "msup") return this.lang.endSubscriptSuperscript(this.verbosity);
			if (e === "mover") return this.lang.endOverScript(this.verbosity);
			if (e === "munder") return this.lang.endUnderScript(this.verbosity);
			if (e === "munderover") return this.lang.endOverUnderScript(this.verbosity);
		},

		getMathSpeak: function(e, d) {
			var item = d.data[0].data[0];
			var hex = item.charCodeAt().toString(16).toUpperCase();
			if(this.dependsOnPreviousElement(item, hex)) {
				return this.dependsMathSpeak(item, hex);
			}
			if (e === "mn") { //math number
				return this.processMathNumber(item);
			} else if (e === "mo") { //operator
				return this.processMathOperator(hex, item);
			} else if (e === "mi") { //identifier
				return this.processMathIdentifier(d, item, hex);
			} else if (e === "ms") { //string literal
				return item + " ";
			} else if (e === "mtext") {
				return this.processMathText(item, hex);
				//return item + " ";
			} else {
				console.log(e + " ahhhh!");
				return "";
			}
		},

		processMathNumber: function(n) {
			var ms = "";
			if (n.match("^[-+]?\\d{1,}$")) {
				return this.numberMathSpeak(n);
			} else if (n.match("^[-+]?\\d*\\.{1}\\d+$")) {
				return this.numberMathSpeak(n);
			} else if (n.match("^[-+]?\\d{1}\\.(?=\\d+)\\w[eE]{1}[-+]?\\d+$")) {
				return this.scientificNotationMathSpeak(n);
			} else if (n.match("\\w[IVXLCDMivxlcdm]+$")) {
				return this.romanNumeralMathSpeak(n);
			} else if (n.match("\\d[0]?(?=\\w[xX]?)\\w[0-9A-Fa-f]\\.?\\w[0-9A-Fa-f]+$")) {
				return this.hexMathSpeak(n);
			//} else if (isTextNumber(n)) {
			//	console.log(n + " is text number");
			//	return this.lang.numberIndicator(this.config.verbosity) + n + " ";
			} else {
				return this.genericNumberMathSpeak(n);
			}
		},

		processMathOperator: function(hex, item) {
			if (item === "x") return this.lang.timesText + " ";
			if (this.lang.isArrow(hex)) {
					return this.lang.arrowText(hex, this.verbosity);
			}
			if (item === "(" || item === ")") {
				return this.lang.parenText(item, this.verbosity);
			}
			if (item === "[" || item === "]") {
				return this.lang.bracketText(item, this.verbosity);
			}
			if (item === "{" || item === "}") {
				return this.lang.braceText(item, this.verbosity);
			}
			if (this.lang.mocodes[item]) {
				return this.lang.mocodes[item] + " ";
			}
			if (this.lang.mocodes[hex]) {
				return this.lang.mocodes[hex] + " ";				
			}
			return item + " ";
		},

		processMathText: function(item, hex) {
			var abbreviations = this.lang.abbreviations();
			var charCode = this.getHexCharCode(item.charAt(0)) + item.substring(1);
			for (var i = 0; i < abbreviations.length; i++) {
				console.log(abbreviations[i][0] + " " + item);
				if (abbreviations[i][0] === item || abbreviations[i][0] === charCode) {
					return abbreviations[i][1] + " ";
				}
			}
			return item + " ";
		},

		numberMathSpeak: function(n) {
			var ms = "";		
			//if - or char code for minus
			var c0 = n.charAt(0);
			if (this.isMinusSign(c0, this.getHexCharCode(c0))) {
//n.charAt(0) === '-' || n.charAt(0).charCodeAt().toString(16).toUpperCase() === "2212") {
				ms += this.lang.negative();
				n = n.substring(1);
			}
			ms += n + " ";
			return ms;
		},
		
		genericNumberMathSpeak: function(n) {
			var ms = "";
			var ms = this.lang.numberIndicator(this.verbosity);
			for (var i = 0; i < n.length; i++) {
				var c = n.charAt(i);
				var chex = c.charCodeAt().toString(16).toUpperCase();
				ms += this.lang.getCharMathSpeak(c, chex, this.verbosity);
			}
			return ms;		
		},

		scientificNotationMathSpeak: function(n) {
			return this.genericNumberMathSpean(n);
			/*var ms = this.lang.numberIndicator(this.verbosity);
			var eInd;
			if (n.contains("e")) {
				eInd = n.indexOf("e");
			} else {
				eInd = n.indexOf("E");
			}
			var num = s.substring(0, eInd);
			var exp = s.substring(eInd+1);
		
			ms += this.numberMathSpeak(num);
			ms += this.lang.scientificNotation(this.getNumberMathSpeak(exp));
			return ms;*/
		},

		romanNumeralMathSpeak: function(n) {
			var ms = this.lang.numberIndicator(this.verbosity);
			ms += this.lang.casePrefix(n.length, this.isLower(n.charAt(0)));
			for (var i = 0; i < n.length; i++) {
				ms += n.charAt(i) + " ";
			}
			return ms;
		},

		hexMathSpeak: function(n) {
			var ms = this.lang.numberIndicator(this.verbosity);
			for (var i = 0; i < n.length(); i++) {
				ms += n.charAt(i) + " ";
			}
			return ms;
		},

		processMathIdentifier: function(d, item, hex) {
			//console.log(d);
			//console.log(item);
			//maybe I should do item.toLowerCase() to ensure consistency
			if (item === "") {return "";}
			if (d.mathvariant) {
				var v = d.mathvariant;
				if (v === "script" || v === "bold" || v === "italic" || "double-struck" || "bold-fraktur" || "script" || "bold-script" || "fraktur" || "sans-serif" || "bold-sans-serif" || "sans-serif-italic" || "sans-serif-bold-italic" || "monospace") {
					var ms = v + " ";
					if (this.isUpper(item)) {ms += this.lang.uppercaseCharText + " ";}
					return ms + item + " ";
				}
			}
			if (this.lang.trig[item]) {
				return this.lang.trig[item] + " ";
			}
			if (this.lang.greek[hex]) {
				return this.lang.greek[hex] + " ";
			}
			if (this.lang.mocodes[hex]) {
				return this.lang.mocodes[hex] + " ";
			}
			if (this.lang.mocodes[item]) {
				return this.lang.mocodes[item] + " ";
			}
			var ms = "";
			if (this.isUpper(item)) {ms += this.lang.uppercaseCharText + " ";}
			return ms + item + " ";
		},

		dependsOnPreviousElement: function(item, hex) {
			//console.log("depends hex: " + hex);
			//if a -, if something before say 'minus' else say 'negative'	
			if (this.isMinusSign(item, hex)) {return true;}
			//if (item === "-") return true; if (hex === "2212") return true; 
			//if f...() need to say f of (...)
			if (this.isParen(item, hex)) {return true;}
			//if (item === "(" || item === ")") return true;
			if (item === "|") {return true;} //abs val
			return false;
		},

		dependsMathSpeak: function(item, hex) {
			//console.log("depends previous: " + this.previous);
			if (this.isMinusSign(item, hex)) {//hex === "2212" || item === "-") {  // if minus
				if (this.previous === "") {
					return this.lang.negative();
				} 
				var previtem = this.previous.data[0].data[0];
				var prevhex = this.getHexCharCode(previtem); //previtem.charCodeAt().toString(16).toUpperCase(); 
				if (this.isMinusSign(previtem, prevhex)) { //previtem === "-" || prevhex === "2122") {
					return this.lang.negative();
				}
				return this.lang.minus();
				//if previous is empty return negative, else return minus
			}
			if (item === "(") {
				if (this.previous !== "") {
					var previtem = this.previous.data[0].data[0];
					var prevhex = this.getHexCharCode(previtem); //previtem.charCodeAt().toString(16).toUpperCase();
					if (this.isFunctionPrefix(previtem)) { 
//previtem === "f" || previtem === "g" || this.trig[previtem]) {
						this.inFunction = true;
						this.parenCount = this.parenCount + 1;
						return this.lang.functionOf();
					} else {
						this.parenCount = this.parenCount + 1;
					}
				}
				return this.processMathOperator("null", item, hex);
				//if previous is f, g, or trig func return of and set var inside func = true, set paren count == 1
				//if previous is not one of those, increment paren count and return "OpenParen";
			}
			if (item === ")") {
				this.parenCount = this.parenCount - 1;
				//console.log(this.parenCount);
				if (this.parenCount === 0) {
					this.inFunction = false;
					return "";
				}
				return this.processMathOperator("null", item, hex); // RightParen
				//decrement parent count, if paren count == 0, set inside func = false, return "" end of function
			}
			if (item === "|") { //abs val
				if (!this.inAbsVal) {
					this.inAbsVal = true;
					return this.lang.absValText("start", this.verbosity);
				} else {
					this.inAbsVal = false;
					return this.lang.absValText("end", this.verbosity);
				}
			}
		},

		//helper functions
		isLower: function(c) {
      var code = c.charCodeAt(0);
      if(code > 96 && code < 123) {
         return true;
      }
      return false;
		},

		isUpper: function(c) {
			var code = c.charCodeAt(0);
			if (code < 91 && code > 64) {
				return true;
			}
			return false;
		},

		getHexCharCode: function(c) {
			return c.charCodeAt().toString(16).toUpperCase();
		},

		isMinusSign: function(item, hex) {
			if (item === "-" || hex === "2122") {return true;}
			return false;
		},

		isFunctionPrefix: function(item) {
			if (item === "f" || item === "g" || this.trig[item]) {return true;}
			return false;
		},

		isParen: function(item, hex) {
			if (item === "(" || item === ")") {return true;}
			return false;
		}

	}	

};

MathJax.Hub.Register.PreProcessor(["PreProcess",MathJax.Extension.jax2MathSpeak]);
MathJax.Ajax.loadComplete("[MathJax]/extensions/jax2MathSpeak.js");
