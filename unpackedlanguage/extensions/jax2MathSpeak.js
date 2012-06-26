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
//TODO: produce squared text when exponent is 2 instead of "superscript 2 baseline"
//TODO: the mathspeak standard wants to differentiate between subscripts and chemical formulas
		//I don't know how they expect this to be done. how can i know FE(sub2) or O(sub2) is not just
		//some mathematical notation?, Event if I store the abbreviations for all the elements this is 
		//difficult
//TODO: how to deal with nested fractions?
//TODO: how to deal with nested roots?
//TODO: how to deal with cancelled mi's?
//TODO: expand under/over modification specifications
		//TODO: allow for modifiying with varying overscripts
//TODO: unit abbreviations. would units generally be put in <mtext> tags? or <ms> tags? etc?
//TODO: layouts
//TODO: linear alg

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
	
	getMathSpeakText: function() {
		return this.mathSpeakText;
	},

	generateMathSpeak: function(inputJax) {
		this.tagStack = [];
		this.mathSpeakText = "";
		if (inputJax.root) {
			var jax = inputJax.root;
			this.processNode(jax);
		} else console.log("error");
		//start the traversal
	},

	processNode: function(node) {
		if (node.data) {
			var type = node.type;	
			this.mathSpeakText += this.startElement(type);
			this.processElement(type, node);
			this.mathSpeakText += this.endElement();
		}
	},

	startElement: function(t) {
		this.tagStack.push(t);
		if (this.MathMLMathSpeak.hasStartHandler(t)) {
			return this.MathMLMathSpeak.startHandler(t);
		} else return "";
	},

	processElement: function(type, node) {
		if (this.MathMLTags.isTokenElement(type)) {
			this.mathSpeakText += this.MathMLMathSpeak.getMathSpeak(type, node);
			//console.log(this.mathSpeakText);
		} else {
			var children = this.getChildren(node);
			/*if (type === "mroot") { //switch base and index
				var tmp = children[1];
				children[1] = children[0];
				children[0] = tmp;
			}	*/		
			for (var i = 0, l = children.length; i < l; i++) {
				var child = children[i];
				if (i == 0) {this.MathMLMathSpeak.previous = "";}
				if (i > 0) {this.MathMLMathSpeak.previous = children[i-1];}
				/*if (type === "msup") {
					console.log(children[1].data[0].data[0]);					
					if (children[1].data[0].data[0] === "2") {
						console.log("msupchild: " + children[1].data);
						console.log("squared");
					}
				}*/
				if (i == 1 && this.MathMLMathSpeak.hasMiddleHandler(type)) {
					this.mathSpeakText += this.MathMLMathSpeak.middleHandler(type);
				}
				this.processNode(child);
			}
		}
	},

	endElement: function() {
		var t = this.tagStack.pop();
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
			if (t === "mfrac" || t === "msqrt" || t === "mroot") {
				return true;
			}
			if (t === "mover") {
				return true;
			}
			return false;
		},

		startHandler: function(e) {
			if (e === "mfrac") return this.lang.startFrac();
			if (e === "msqrt") return this.lang.startSqrt(this.verbosity);
			if (e === "mroot") return this.lang.startRoot(this.verbosity);
			if (e === "mover") return this.lang.startOverScript(this.verbosity);
		},

		hasMiddleHandler: function(t) {
			if (t === "mfrac") {
				return true;
			}
			if (t === "msub" || t === "msup" || t === "subsuppair") {
				return true;
			}
			if (t === "mroot") {
				return true;
			}
			return false;
		},

		middleHandler: function(e) {
			if (e === "mfrac") return this.lang.midFrac();
			if (e === "msup") return this.lang.midSuperscript(this.verbosity);
			if (e === "msub") return this.lang.midSubscript(this.verbosity);
			if (e === "mroot") return this.lang.midRoot(this.verbosity);
		},

		hasEndHandler: function(t) {
			if (t === "mfrac" || t === "msqrt" || t === "mroot") {
				return true;
			}
			if (t === "msub" || t === "msup") {
				return true;
			}
			if (t === "mover") {
				return true;
			}
			return false;
		},

		endHandler: function(e) {
			if (e === "mfrac") return this.lang.endFrac();
			if (e === "msqrt" || e === "mroot") return this.lang.endRoot();
			if (e === "msub" || e === "msup") return this.lang.endSubscriptSuperscript(this.verbosity);
			if (e === "mover") return this.lang.endOverScript(this.verbosity);
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
			console.log(item + " " + this.lang.abbreviations);
			for (var i = 0; i < this.lang.abbreviations.length; i++) {
				console.log(this.lang.abbreviations[i]);
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
			//if (item === "...") {
			//	return this.lang.ellipses();
			//}
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
