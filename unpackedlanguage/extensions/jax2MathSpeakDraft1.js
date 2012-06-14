/*************************************************************
 *
 *  MathJax/extensions/jax2MathSpeak.js
 *  
 *  Implements Jax to MathSpeak
 *
 */

MathJax.Extension.jax2MathSpeak = {
  
	config: {
    verbosity: 0,
    verbosity_options: ["verbose","brief","superbrief"]
  },
  
  PreProcess: function (element) {
    if (!this.configured) {
      this.config = MathJax.Hub.CombineConfig("jax2MathSpeak",this.config);
      if (this.config.Augment) {MathJax.Hub.Insert(this,this.config.Augment)}
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

		var jax;
		if (inputJax.root) {
			jax = inputJax.root;
			//console.log(jax);
		} else console.log("error");

		//start the traversal
		this.processNode(jax);
	},

	processNode: function(node) {
		if (node.data) {
			var type = node.type;	
			//console.log("mathSpeak: " + this.mathSpeakText);
			this.mathSpeakText += this.startElement(type);
			this.processElement(type, node);
			this.mathSpeakText += this.endElement();
		}
	},

	startElement: function(t) {
		this.tagStack.push(t);
		//console.log(t + " " + this.tagStack);
		if (this.MathMLMathSpeak.hasStartHandler(t)) {
			return this.MathMLMathSpeak.startHandler(t);
		} else return "";
	},

	processElement: function(type, node) {
		//console.log("processElement");
		if (this.MathMLTags.isTokenElement(type)) {
			//console.log("token");
			//console.log(node);
			//console.log("token element: " + type);
			this.mathSpeakText += this.MathMLMathSpeak.getMathSpeak(type, node);
			console.log(this.mathSpeakText);
		} else {
			var children = this.getChildren(node);
			//console.log("children: ");			
			//console.log(node);
			for (var i = 0, l = children.length; i < l; i++) {
				//console.log("#children: " + children.length);				
				//console.log("child: " + i);
				var child = children[i];
				//console.log("parent: " + type);				
				//console.log(child);
				
				if (i == 1 && this.MathMLMathSpeak.hasMiddleHandler(type)) {
					this.mathSpeakText += this.MathMLMathSpeak.middleHandler(type);
				}
				//console.log("child");
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
		//console.log("getChildren");
		//console.log(e);
		return e.data;
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
	
		hasStartHandler: function(t) {
			if (t === "mfrac" || t === "msqrt" || t === "mroot") {
				return true;
			}
			return false;
		},

		startHandler: function(e) {
			if (e === "mfrac") return "StartFraction ";
			if (e === "msqrt") return "StartRoot ";
			if (e === "mroot") return "StartRoot ";
		},

		hasMiddleHandler: function(t) {
			//console.log("hasMiddleHandler: " + t);
			if (t === "mfrac") {
				return true;
			}
			if (t === "msub" || t === "msup" || t === "subsuppair") {
				return true;
			}
			return false;
		},

		middleHandler: function(e) {
			//console.log("middleHandler");
			//console.log(e);
			if (e === "mfrac") return "Over ";
			if (e === "msup") return "Superscript ";
			if (e === "msub") return "Subscript ";
		},

		hasEndHandler: function(t) {
			//console.log("hasEndHandler");
			//console.log(t);
			if (t === "mfrac" || t === "msqrt" || t === "mroot") {
				return true;
			}
			if (t === "msub" || t === "msup") {
				return true;
			}
			return false;
		},

		endHandler: function(e) {
			if (e === "mfrac") return "EndFraction ";
			if (e === "msqrt" || e === "mroot") return "EndRoot ";
			if (e === "msub" || e === "msup") return "Baseline ";
		},

		getMathSpeak: function(e, d) {
			//console.log("getMathSpeak");			
			//console.log(d);
			//console.log(e);
			
			var item = d.data[0].data[0];
			var hex = item.charCodeAt().toString(16).toUpperCase();
			var depends = this.dependsOnPreviousElement(item);
			console.log("DependsOnPreviousElement: " + depends);

			if (e === "mn") { //math number
				return this.processMathNumber(item);
			} else if (e === "mo") { //operator
				if (this.mocodes[item]) {
					return this.mocodes[item] + " ";
				}
				if (this.mocodes[hex]) {
					return this.mocodes[hex] + " ";				
				}
			} else if (e === "mi") { //identifier
				console.log("mi: " + item);
				return this.processMathIdentifier(d, item, hex);
			} else if (e === "ms") { //string literal
				return item + " ";
			} else if (e === "mtext") {
				return item + " ";
			} else {
				console.log(e + " ahhhh!");
				return "";
			}
		},

		processMathNumber: function(n) {
			var ms = "";
			//console.log("processMathNumber: " + n);
			if (n.match("^[-+]?\\d{1,}")) {
				//console.log(n + " is integer");
				return this.numberMathSpeak(n);
			} else if (n.match("\\d*\\.{1}\\d+")) {
				//does android say "three point one four"?
				//what about 0, does it say zero or oh
				//console.log(n + " is decimal");
				return this.numberMathSpeak(n);
			} else if (n.match("^[-+]?\\d{1}\\.(?=\\d+)\\w[eE]{1}[-+]?\\d+")) {
				//console.log(n + " is scientific notation");
				return this.scientificNotationMathSpeak(n);
			} else if (n.match("\\w[IVXLCDMivxlcdm]+")) {
				//console.log(n + " is roman numeral");
				return this.romanNumeralMathSpeak(n);
			} else if (n.match("\\d[0]?(?=\\w[xX]?)\\w[0-9A-Fa-f]\\.?\\w[0-9A-Fa-f]+")) {
				//console.log(n + " is hex");
				return this.hexMathSpeak(n);
			//} else if (isTextNumber(n)) {
			//	console.log(n + " is text number");
				//return getNumberIndicator(verbosity) + n + " ";
			} else {
				// something else??
				return item;
			}
		},

		numberMathSpeak: function(n) {
			var ms = "";		
			if (n.charAt(0) === '-') {
				ms += "Negative ";
				n = n.substring(1);
			}
			ms += n + " ";
			return ms;
		},

		scientificNotationMathSpeak: function(n) {
			var ms = this.numberIndicator();
			var eInd;
			if (n.contains("e")) {
				eInd = n.indexOf("e");
			} else {
				eInd = n.indexOf("E");
			}
			var num = s.substring(0, eInd);
			var exp = s.substring(eInd+1);
		
			ms += this.numberMathSpeak(num);
			ms += " times 10 to the " + this.getNumberMathSpeak(exp) + "th";
			return ms;
		},

		romanNumeralMathSpeak: function(n) {
			var ms = this.getNumberIndicator();
			for (var i = 0; i < n.length; i++) {
				var c = n.charAt(i);
				if (this.isLower(c)) {
					ms += "Lower ";
				} else {
					ms += "Upper ";
				}
				ms += c + " ";
			}
		},

		hexMathSpeak: function(n) {
			var ms = this.getNumberIndicator();
			for (var i = 0; i < n.length(); i++) {
				ms += n.charAt(i) + " ";
			}
			return ms;
		},

		numberIndicator: function() {
			if (this.config.verbosity === 0) {
				return "Number ";
			}
			return "Num ";
		},

		isLower: function(c) {
      var code = c.charCodeAt(0);
      if(code > 96 && code < 123) {
         return true;
      }
      return false;
		},

		processMathIdentifier: function(d, item, hex) {
			console.log("processMathIdentifier");
			console.log(d);
			console.log(item);

			if (d.mathvariant) {
				var v = d.mathvariant;
				if (v === "script" || v === "bold" || v === "italic" || "double-struck" || "bold-fraktur" || "script" || "bold-script" || "fraktur" || "sans-serif" || "bold-sans-serif" || "sans-serif-italic" || "sans-serif-bold-italic" || "monospace") {
					return v + " " + item + " ";
				}
			}

			if (item === "...") {
				return "elipses ";
			}

			if (item === "") {
				return "";
			}
			
			if (this.trig[item]) {
				return this.trig[item] + " ";
			}

			if (this.greek[hex]) {
				return this.greek[hex] + " ";
			}
			
			return item + " ";
		},

		dependsOnPreviousElement: function(item) {
			//if a -, if something before say 'minus' else say 'negative'			
			if (item === '-') return true;
			//if f...() need to say f of (...)
			if (item === '(') return true;
			return false;
		},

		trig: {
			"sin" : "sign",
			"cos" : "cosign",
			"tan" : "tangent",
			"csc" : "cosecant",
			"sec" : "secant",
			"cot" : "cotangent",
			"arcsin" : "arc sign",
			"arccos" : "arc cosign",
			"arctan" : "arc tangent",
			"arccsc" : "arc cosecant",
			"arcsec" : "arc secant",
			"arccot" : "arc cotangent"
		},

		greek: {
			"370" : "Capital Heta",
			"371" : "Small Heta",
			"372" : "Capital Archaic Sampi",
			"373" : "Small Archaic Sampi",
			"374" : "Numeral Sign",
			"375" : "Lower Numeral Sign",
			"376" : "Capital Pamphylian Digamma",
			"377" : "Small Pamphylian Digamma",
			"37A" : "Ypogegrammeni",
			"37B" : "Small Reversed Lunate Sigma",
			"37C" : "Small Dotted Lunate Sigma",
			"37D" : "Small Reversed Dotted Lunate Sigma",
			"37E" : "Question Mark",
			"384" : "Tonos",
			"385" : "Dialytika Tonos",
			"386" : "Capital Alpha Tonos",
			"387" : "Ano Teleia",
			"388" : "Capital Epsilon Tonos",
			"389" : "Capital Eta Tonos",
			"38A" : "Capital Iota Tonos",
			"38C" : "Capital Omicron Tonos",
			"38E" : "Capital Upsilon Tonos",
			"38F" : "Capital Omega Tonos",
			"390" : "Small Iota Dialytika And Tonos",
			"391" : "Capital Alpha",
			"392" : "Capital Beta",
			"393" : "Capital Gamma",
			"394" : "Capital Delta",
			"395" : "Capital Epsilon",
			"396" : "Capital Zeta",
			"397" : "Capital Eta",
			"398" : "Capital Theta",
			"399" : "Capital Iota",
			"39A" : "Capital Kappa",
			"39B" : "Capital Lamda",
			"39C" : "Capital Mu",
			"39D" : "Capital Nu",
			"39E" : "Capital Xi",
			"39F" : "Capital Omicron",
			"3A0" : "Capital Pi",
			"3A1" : "Capital Rho",
			"3A3" : "Capital Sigma",
			"3A4" : "Capital Tau",
			"3A5" : "Capital Upsilon",
			"3A6" : "Capital Phi",
			"3A7" : "Capital Chi",
			"3A8" : "Capital Psi",
			"3A9" : "Capital Omega",
			"3AA" : "Capital Iota Dialytika",
			"3AB" : "Capital Upsilon Dialytika",
			"3AC" : "Small Alpha Tonos",
			"3AD" : "Small Epsilon Tonos",
			"3AE" : "Small Eta Tonos",
			"3AF" : "Small Iota Tonos",
			"3B0" : "Small Upsilon Dialytika And Tonos",
			"3B1" : "Small Alpha",
			"3B2" : "Small Beta",
			"3B3" : "Small Gamma",
			"3B4" : "Small Delta",
			"3B5" : "Small Epsilon",
			"3B6" : "Small Zeta",
			"3B7" : "Small Eta",
			"3B8" : "Small Theta",
			"3B9" : "Small Iota",
			"3BA" : "Small Kappa",
			"3BB" : "Small Lamda",
			"3BC" : "Small Mu",
			"3BD" : "Small Nu",
			"3BE" : "Small Xi",
			"3BF" : "Small Omicron",
			"3C0" : "Small Pi",
			"3C1" : "Small Rho",
			"3C2" : "Small Final Sigma",
			"3C3" : "Small Sigma",
			"3C4" : "Small Tau",
			"3C5" : "Small Upsilon",
			"3C6" : "Small Phi",
			"3C7" : "Small Chi",
			"3C8" : "Small Psi",
			"3C9" : "Small Omega",
			"3CA" : "Small Iota Dialytika",
			"3CB" : "Small Upsilon Dialytika",
			"3CC" : "Small Omicron Tonos",
			"3CD" : "Small Upsilon Tonos",
			"3CE" : "Small Omega Tonos",
			"3CF" : "Capital Kai",
			"3D0" : "Beta",
			"3D1" : "Theta",
			"3D2" : "Upsilon Hook",
			"3D3" : "Upsilon Acute And Hook",
			"3D4" : "Upsilon Diaeresis And Hook",
			"3D5" : "Phi",
			"3D6" : "Pi",
			"3D7" : "Kai",
			"3D8" : "Archaic Koppa",
			"3D9" : "Small Archaic Koppa",
			"3DA" : "Stigma",
			"3DB" : "Small Stigma",
			"3DC" : "Digamma",
			"3DD" : "Small Digamma",
			"3DE" : "Koppa",
			"3DF" : "Small Koppa",
			"3E0" : "Sampi",
			"3E1" : "Small Sampi",
			"3E2" : "Coptic Capital Shei",
			"3E3" : "Coptic Small Shei",
			"3E4" : "Coptic Capital Fei",
			"3E5" : "Coptic Small Fei",
			"3E6" : "Coptic Capital Khei",
			"3E7" : "Coptic Small Khei",
			"3E8" : "Coptic Capital Hori",
			"3E9" : "Coptic Small Hori",
			"3EA" : "Coptic Capital Gangia",
			"3EB" : "Coptic Small Gangia",
			"3EC" : "Coptic Capital Shima",
			"3ED" : "Coptic Small Shima",
			"3EE" : "Coptic Capital Dei",
			"3EF" : "Coptic Small Dei",
			"3F0" : "Kappa",
			"3F1" : "Rho",
			"3F2" : "Lunate Sigma",
			"3F3" : "Yot",
			"3F4" : "Capital Theta",
			"3F5" : "Lunate Epsilon",
			"3F6" : "Reversed Lunate Epsilon",
			"3F7" : "Capital Sho",
			"3F8" : "Small Sho",
			"3F9" : "Capital Lunate Sigma",
			"3FA" : "Capital San",
			"3FB" : "Small San",
			"3FC" : "Rho Stroke",
			"3FD" : "Capital Reversed Lunate Sigma",
			"3FE" : "Capital Dotted Lunate Sigma",
			"3FF" : "Capital Reversed Dotted Lunate Sigma"
		},

		mocodes: {
			"2018" : "left single quotation mark",
			"2019" : "right single quotation mark",
			"201C" : "left double quotation mark",
			"201D" : "right double quotation mark",
			"(" : "left parenthesis",
			")" : "right parenthesis",
			"[" : "left square bracket",
			"]" : "right square bracket",
			"{" : "left curly bracket",
			"|" : "vertical line",
			"|" : "vertical line",
			"||" : "multiple character operator: ||",
			"||" : "multiple character operator: ||",
			"|||" : "multiple character operator: |||",
			"|||" : "multiple character operator: |||",
			"}" : "right curly bracket",
			"2016" : "double vertical line",
			"2016" : "double vertical line",
			"2308" : "left ceiling",
			"2309" : "right ceiling",
			"230A" : "left floor",
			"230B" : "right floor",
			"2772" : "light left tortoise shell bracket ornament",
			"2773" : "light right tortoise shell bracket ornament",
			"27E6" : "mathematical left white square bracket",
			"27E7" : "mathematical right white square bracket",
			"27E8" : "mathematical left angle bracket",
			"27E9" : "mathematical right angle bracket",
			"27EA" : "mathematical left double angle bracket",
			"27EB" : "mathematical right double angle bracket",
			"27EC" : "mathematical left white tortoise shell bracket",
			"27ED" : "mathematical right white tortoise shell bracket",
			"27EE" : "mathematical left flattened parenthesis",
			"27EF" : "mathematical right flattened parenthesis",
			"2980" : "triple vertical bar delimiter",
			"2980" : "triple vertical bar delimiter",
			"2983" : "left white curly bracket",
			"2984" : "right white curly bracket",
			"2985" : "left white parenthesis",
			"2986" : "right white parenthesis",
			"2987" : "z notation left image bracket",
			"2988" : "z notation right image bracket",
			"2989" : "z notation left binding bracket",
			"298A" : "z notation right binding bracket",
			"298B" : "left square bracket with underbar",
			"298C" : "right square bracket with underbar",
			"298D" : "left square bracket with tick in top corner",
			"298E" : "right square bracket with tick in bottom corner",
			"298F" : "left square bracket with tick in bottom corner",
			"2990" : "right square bracket with tick in top corner",
			"2991" : "left angle bracket with dot",
			"2992" : "right angle bracket with dot",
			"2993" : "left arc less-than bracket",
			"2994" : "right arc greater-than bracket",
			"2995" : "double left arc greater-than bracket",
			"2996" : "double right arc less-than bracket",
			"2997" : "left black tortoise shell bracket",
			"2998" : "right black tortoise shell bracket",
			"29FC" : "left-pointing curved angle bracket",
			"29FD" : "right-pointing curved angle bracket",
			"" : "semicolon",
			"," : "comma",
			"2063" : "invisible separator",
			"2234" : "therefore",
			"2235" : "because",
			"->" : "multiple character operator: ->",
			".." : "multiple character operator: ..",
			"..." : "multiple character operator: ...",
			":" : "colon",
			"3F6" : "greek reversed lunate epsilon symbol",
			"2026" : "horizontal ellipsis",
			"22EE" : "vertical ellipsis",
			"22EF" : "midline horizontal ellipsis",
			"22F1" : "down right diagonal ellipsis",
			"220B" : "contains as member",
			"22A2" : "right tack",
			"22A3" : "left tack",
			"22A4" : "down tack",
			"22A8" : "true",
			"22A9" : "forces",
			"22AC" : "does not prove",
			"22AD" : "not true",
			"22AE" : "does not force",
			"22AF" : "negated double vertical bar double right turnstile",
			"2228" : "logical or",
			"&amp;&amp" : "multiple character operator: &&",
			"2227" : "logical and",
			"2200" : "for all",
			"2203" : "there exists",
			"2204" : "there does not exist",
			"2201" : "complement",
			"2208" : "element of",
			"2209" : "not an element of",
			"220C" : "does not contain as member",
			"2282" : "subset of",
			"2282;&#x20D2" : "subset of with vertical line",
			"2283" : "superset of",
			"2283;&#x20D2" : "superset of with vertical line",
			"2284" : "not a subset of",
			"2285" : "not a superset of",
			"2286" : "subset of or equal to",
			"2287" : "superset of or equal to",
			"2288" : "neither a subset of nor equal to",
			"2289" : "neither a superset of nor equal to",
			"228A" : "subset of with not equal to",
			"228B" : "superset of with not equal to",
			"&lt;=" : "multiple character operator: <=",
			"2264" : "less-than or equal to",
			"2265" : "greater-than or equal to",
			">" : "greater-than sign",
			">=" : "multiple character operator: >=",
			"226F" : "not greater-than",
			"&lt" : "less-than sign",
			"226E" : "not less-than",
			"2248" : "almost equal to",
			"223C" : "tilde operator",
			"2249" : "not almost equal to",
			"2262" : "not identical to",
			"2260" : "not equal to",
			"!=" : "multiple character operator: !=",
			"*=" : "multiple character operator: *=",
			"+=" : "multiple character operator: +=",
			"-=" : "multiple character operator: -=",
			"/=" : "multiple character operator: /=",
			":=" : "multiple character operator: :=",
			"=" : "equals sign",
			"==" : "multiple character operator: ==",
			"221D" : "proportional to",
			"2224" : "does not divide",
			"2225" : "parallel to",
			"2226" : "not parallel to",
			"2241" : "not tilde",
			"2243" : "asymptotically equal to",
			"2244" : "not asymptotically equal to",
			"2245" : "approximately equal to",
			"2246" : "approximately but not actually equal to",
			"2247" : "neither approximately nor actually equal to",
			"224D" : "equivalent to",
			"2254" : "colon equals",
			"2257" : "ring equal to",
			"2259" : "estimates",
			"225A" : "equiangular to",
			"225C" : "delta equal to",
			"225F" : "questioned equal to",
			"2261" : "identical to",
			"2268" : "less-than but not equal to",
			"2269" : "greater-than but not equal to",
			"226A" : "much less-than",
			"226A;&#x338" : "much less than with slash",
			"226B" : "much greater-than",
			"226B;&#x338" : "much greater than with slash",
			"226D" : "not equivalent to",
			"2270" : "neither less-than nor equal to",
			"2271" : "neither greater-than nor equal to",
			"227A" : "precedes",
			"227B" : "succeeds",
			"227C" : "precedes or equal to",
			"227D" : "succeeds or equal to",
			"2280" : "does not precede",
			"2281" : "does not succeed",
			"22A5" : "up tack",
			"22B4" : "normal subgroup of or equal to",
			"22B5" : "contains as normal subgroup or equal to",
			"22C9" : "left normal factor semidirect product",
			"22CA" : "right normal factor semidirect product",
			"22CB" : "left semidirect product",
			"22CC" : "right semidirect product",
			"22D4" : "pitchfork",
			"22D6" : "less-than with dot",
			"22D7" : "greater-than with dot",
			"22D8" : "very much less-than",
			"22D9" : "very much greater-than",
			"22EA" : "not normal subgroup of",
			"22EB" : "does not contain as normal subgroup",
			"22EC" : "not normal subgroup of or equal to",
			"22ED" : "does not contain as normal subgroup or equal",
			"25A0" : "black square",
			"25A1" : "white square",
			"25AA" : "black small square",
			"25AB" : "white small square",
			"25AD" : "white rectangle",
			"25AE" : "black vertical rectangle",
			"25AF" : "white vertical rectangle",
			"25B0" : "black parallelogram",
			"25B1" : "white parallelogram",
			"25B3" : "white up-pointing triangle",
			"25B4" : "black up-pointing small triangle",
			"25B5" : "white up-pointing small triangle",
			"25B6" : "black right-pointing triangle",
			"25B7" : "white right-pointing triangle",
			"25B8" : "black right-pointing small triangle",
			"25B9" : "white right-pointing small triangle",
			"25BC" : "black down-pointing triangle",
			"25BD" : "white down-pointing triangle",
			"25BE" : "black down-pointing small triangle",
			"25BF" : "white down-pointing small triangle",
			"25C0" : "black left-pointing triangle",
			"25C1" : "white left-pointing triangle",
			"25C2" : "black left-pointing small triangle",
			"25C3" : "white left-pointing small triangle",
			"25C4" : "black left-pointing pointer",
			"25C5" : "white left-pointing pointer",
			"25C6" : "black diamond",
			"25C7" : "white diamond",
			"25C8" : "white diamond containing black small diamond",
			"25C9" : "fisheye",
			"25CC" : "dotted circle",
			"25CD" : "circle with vertical fill",
			"25CE" : "bullseye",
			"25CF" : "black circle",
			"25D6" : "left half black circle",
			"25D7" : "right half black circle",
			"25E6" : "white bullet",
			"29C0" : "circled less-than",
			"29C1" : "circled greater-than",
			"29E3" : "equals sign and slanted parallel",
			"29E4" : "equals sign and slanted parallel with tilde above",
			"29E5" : "identical to and slanted parallel",
			"29E6" : "gleich stark",
			"29F3" : "error-barred black circle",
			"2A87" : "less-than and single-line not equal to",
			"2A88" : "greater-than and single-line not equal to",
			"2AAF" : "precedes above single-line equals sign",
			"2AAF;&#x338" : "precedes above single-line equals sign with slash",
			"2AB0" : "succeeds above single-line equals sign",
			"2AB0;&#x338" : "succeeds above single-line equals sign with slash",
			"2044" : "fraction slash",
			"2206" : "increment",
			"220A" : "small element of",
			"220D" : "small contains as member",
			"220E" : "end of proof",
			"2215" : "division slash",
			"2217" : "asterisk operator",
			"2218" : "ring operator",
			"2219" : "bullet operator",
			"221F" : "right angle",
			"2223" : "divides",
			"2236" : "ratio",
			"2237" : "proportion",
			"2238" : "dot minus",
			"2239" : "excess",
			"223A" : "geometric proportion",
			"223B" : "homothetic",
			"223D" : "reversed tilde",
			"223D;&#x331" : "reversed tilde with underline",
			"223E" : "inverted lazy s",
			"223F" : "sine wave",
			"2242" : "minus tilde",
			"2242;&#x338" : "minus tilde with slash",
			"224A" : "almost equal or equal to",
			"224B" : "triple tilde",
			"224C" : "all equal to",
			"224E" : "geometrically equivalent to",
			"224E;&#x338" : "geometrically equivalent to with slash",
			"224F" : "difference between",
			"224F;&#x338" : "difference between with slash",
			"2250" : "approaches the limit",
			"2251" : "geometrically equal to",
			"2252" : "approximately equal to or the image of",
			"2253" : "image of or approximately equal to",
			"2255" : "equals colon",
			"2256" : "ring in equal to",
			"2258" : "corresponds to",
			"225D" : "equal to by definition",
			"225E" : "measured by",
			"2263" : "strictly equivalent to",
			"2266" : "less-than over equal to",
			"2266;&#x338" : "less-than over equal to with slash",
			"2267" : "greater-than over equal to",
			"226C" : "between",
			"2272" : "less-than or equivalent to",
			"2273" : "greater-than or equivalent to",
			"2274" : "neither less-than nor equivalent to",
			"2275" : "neither greater-than nor equivalent to",
			"2276" : "less-than or greater-than",
			"2277" : "greater-than or less-than",
			"2278" : "neither less-than nor greater-than",
			"2279" : "neither greater-than nor less-than",
			"227E" : "precedes or equivalent to",
			"227F" : "succeeds or equivalent to",
			"227F;&#x338" : "succeeds or equivalent to with slash",
			"228C" : "multiset",
			"228D" : "multiset multiplication",
			"228E" : "multiset union",
			"228F" : "square image of",
			"228F;&#x338" : "square image of with slash",
			"2290" : "square original of",
			"2290;&#x338" : "square original of with slash",
			"2291" : "square image of or equal to",
			"2292" : "square original of or equal to",
			"2293" : "square cap",
			"2294" : "square cup",
			"229A" : "circled ring operator",
			"229B" : "circled asterisk operator",
			"229C" : "circled equals",
			"229D" : "circled dash",
			"22A6" : "assertion",
			"22A7" : "models",
			"22AA" : "triple vertical bar right turnstile",
			"22AB" : "double vertical bar double right turnstile",
			"22B0" : "precedes under relation",
			"22B1" : "succeeds under relation",
			"22B2" : "normal subgroup of",
			"22B3" : "contains as normal subgroup",
			"22B6" : "original of",
			"22B7" : "image of",
			"22B9" : "hermitian conjugate matrix",
			"22BA" : "intercalate",
			"22BB" : "xor",
			"22BC" : "nand",
			"22BD" : "nor",
			"22BE" : "right angle with arc",
			"22BF" : "right triangle",
			"22C4" : "diamond operator",
			"22C6" : "star operator",
			"22C7" : "division times",
			"22C8" : "bowtie",
			"22CD" : "reversed tilde equals",
			"22CE" : "curly logical or",
			"22CF" : "curly logical and",
			"22D0" : "double subset",
			"22D1" : "double superset",
			"22D2" : "double intersection",
			"22D3" : "double union",
			"22D5" : "equal and parallel to",
			"22DA" : "less-than equal to or greater-than",
			"22DB" : "greater-than equal to or less-than",
			"22DC" : "equal to or less-than",
			"22DD" : "equal to or greater-than",
			"22DE" : "equal to or precedes",
			"22DF" : "equal to or succeeds",
			"22E0" : "does not precede or equal",
			"22E1" : "does not succeed or equal",
			"22E2" : "not square image of or equal to",
			"22E3" : "not square original of or equal to",
			"22E4" : "square image of or not equal to",
			"22E5" : "square original of or not equal to",
			"22E6" : "less-than but not equivalent to",
			"22E7" : "greater-than but not equivalent to",
			"22E8" : "precedes but not equivalent to",
			"22E9" : "succeeds but not equivalent to",
			"22F0" : "up right diagonal ellipsis",
			"22F2" : "element of with long horizontal stroke",
			"22F3" : "element of with vertical bar at end of horizontal stroke",
			"22F4" : "small element of with vertical bar at end of horizontal stroke",
			"22F5" : "element of with dot above",
			"22F6" : "element of with overbar",
			"22F7" : "small element of with overbar",
			"22F8" : "element of with underbar",
			"22F9" : "element of with two horizontal strokes",
			"22FA" : "contains with long horizontal stroke",
			"22FB" : "contains with vertical bar at end of horizontal stroke",
			"22FC" : "small contains with vertical bar at end of horizontal stroke",
			"22FD" : "contains with overbar",
			"22FE" : "small contains with overbar",
			"22FF" : "z notation bag membership",
			"25B2" : "black up-pointing triangle",
			"2758" : "light vertical bar",
			"2981" : "z notation spot",
			"2982" : "z notation type colon",
			"29A0" : "spherical angle opening left",
			"29A1" : "spherical angle opening up",
			"29A2" : "turned angle",
			"29A3" : "reversed angle",
			"29A4" : "angle with underbar",
			"29A5" : "reversed angle with underbar",
			"29A6" : "oblique angle opening up",
			"29A7" : "oblique angle opening down",
			"29A8" : "measured angle with open arm ending in arrow pointing up and right",
			"29A9" : "measured angle with open arm ending in arrow pointing up and left",
			"29AA" : "measured angle with open arm ending in arrow pointing down and right",
			"29AB" : "measured angle with open arm ending in arrow pointing down and left",
			"29AC" : "measured angle with open arm ending in arrow pointing right and up",
			"29AD" : "measured angle with open arm ending in arrow pointing left and up",
			"29AE" : "measured angle with open arm ending in arrow pointing right and down",
			"29AF" : "measured angle with open arm ending in arrow pointing left and down",
			"29B0" : "reversed empty set",
			"29B1" : "empty set with overbar",
			"29B2" : "empty set with small circle above",
			"29B3" : "empty set with right arrow above",
			"29B4" : "empty set with left arrow above",
			"29B5" : "circle with horizontal bar",
			"29B6" : "circled vertical bar",
			"29B7" : "circled parallel",
			"29B8" : "circled reverse solidus",
			"29B9" : "circled perpendicular",
			"29BA" : "circle divided by horizontal bar and top half divided by vertical bar",
			"29BB" : "circle with superimposed x",
			"29BC" : "circled anticlockwise-rotated division sign",
			"29BD" : "up arrow through circle",
			"29BE" : "circled white bullet",
			"29BF" : "circled bullet",
			"29C2" : "circle with small circle to the right",
			"29C3" : "circle with two horizontal strokes to the right",
			"29C4" : "squared rising diagonal slash",
			"29C5" : "squared falling diagonal slash",
			"29C6" : "squared asterisk",
			"29C7" : "squared small circle",
			"29C8" : "squared square",
			"29C9" : "two joined squares",
			"29CA" : "triangle with dot above",
			"29CB" : "triangle with underbar",
			"29CC" : "s in triangle",
			"29CD" : "triangle with serifs at bottom",
			"29CE" : "right triangle above left triangle",
			"29CF" : "left triangle beside vertical bar",
			"29CF;&#x338" : "left triangle beside vertical bar with slash",
			"29D0" : "vertical bar beside right triangle",
			"29D0;&#x338" : "vertical bar beside right triangle with slash",
			"29D1" : "bowtie with left half black",
			"29D2" : "bowtie with right half black",
			"29D3" : "black bowtie",
			"29D4" : "times with left half black",
			"29D5" : "times with right half black",
			"29D6" : "white hourglass",
			"29D7" : "black hourglass",
			"29D8" : "left wiggly fence",
			"29D9" : "right wiggly fence",
			"29DB" : "right double wiggly fence",
			"29DC" : "incomplete infinity",
			"29DD" : "tie over infinity",
			"29DE" : "infinity negated with vertical bar",
			"29E0" : "square with contoured outline",
			"29E1" : "increases as",
			"29E2" : "shuffle product",
			"29E7" : "thermodynamic",
			"29E8" : "down-pointing triangle with left half black",
			"29E9" : "down-pointing triangle with right half black",
			"29EA" : "black diamond with down arrow",
			"29EB" : "black lozenge",
			"29EC" : "white circle with down arrow",
			"29ED" : "black circle with down arrow",
			"29EE" : "error-barred white square",
			"29F0" : "error-barred white diamond",
			"29F1" : "error-barred black diamond",
			"29F2" : "error-barred white circle",
			"29F5" : "reverse solidus operator",
			"29F6" : "solidus with overbar",
			"29F7" : "reverse solidus with horizontal stroke",
			"29F8" : "big solidus",
			"29F9" : "big reverse solidus",
			"29FA" : "double plus",
			"29FB" : "triple plus",
			"29FE" : "tiny",
			"29FF" : "miny",
			"2A1D" : "join",
			"2A1E" : "large left triangle operator",
			"2A1F" : "z notation schema composition",
			"2A20" : "z notation schema piping",
			"2A21" : "z notation schema projection",
			"2A22" : "plus sign with small circle above",
			"2A23" : "plus sign with circumflex accent above",
			"2A24" : "plus sign with tilde above",
			"2A25" : "plus sign with dot below",
			"2A26" : "plus sign with tilde below",
			"2A27" : "plus sign with subscript two",
			"2A28" : "plus sign with black triangle",
			"2A29" : "minus sign with comma above",
			"2A2A" : "minus sign with dot below",
			"2A2B" : "minus sign with falling dots",
			"2A2C" : "minus sign with rising dots",
			"2A2D" : "plus sign in left half circle",
			"2A2E" : "plus sign in right half circle",
			"2A30" : "multiplication sign with dot above",
			"2A31" : "multiplication sign with underbar",
			"2A32" : "semidirect product with bottom closed",
			"2A33" : "smash product",
			"2A34" : "multiplication sign in left half circle",
			"2A35" : "multiplication sign in right half circle",
			"2A36" : "circled multiplication sign with circumflex accent",
			"2A37" : "multiplication sign in double circle",
			"2A38" : "circled division sign",
			"2A39" : "plus sign in triangle",
			"2A3A" : "minus sign in triangle",
			"2A3B" : "multiplication sign in triangle",
			"2A3C" : "interior product",
			"2A3D" : "righthand interior product",
			"2A3E" : "z notation relational composition",
			"2A40" : "intersection with dot",
			"2A41" : "union with minus sign",
			"2A42" : "union with overbar",
			"2A43" : "intersection with overbar",
			"2A44" : "intersection with logical and",
			"2A45" : "union with logical or",
			"2A46" : "union above intersection",
			"2A47" : "intersection above union",
			"2A48" : "union above bar above intersection",
			"2A49" : "intersection above bar above union",
			"2A4A" : "union beside and joined with union",
			"2A4B" : "intersection beside and joined with intersection",
			"2A4C" : "closed union with serifs",
			"2A4D" : "closed intersection with serifs",
			"2A4E" : "double square intersection",
			"2A4F" : "double square union",
			"2A50" : "closed union with serifs and smash product",
			"2A51" : "logical and with dot above",
			"2A52" : "logical or with dot above",
			"2A53" : "double logical and",
			"2A54" : "double logical or",
			"2A55" : "two intersecting logical and",
			"2A56" : "two intersecting logical or",
			"2A57" : "sloping large or",
			"2A58" : "sloping large and",
			"2A59" : "logical or overlapping logical and",
			"2A5A" : "logical and with middle stem",
			"2A5B" : "logical or with middle stem",
			"2A5C" : "logical and with horizontal dash",
			"2A5D" : "logical or with horizontal dash",
			"2A5E" : "logical and with double overbar",
			"2A5F" : "logical and with underbar",
			"2A60" : "logical and with double underbar",
			"2A61" : "small vee with underbar",
			"2A62" : "logical or with double overbar",
			"2A63" : "logical or with double underbar",
			"2A64" : "z notation domain antirestriction",
			"2A65" : "z notation range antirestriction",
			"2A66" : "equals sign with dot below",
			"2A67" : "identical with dot above",
			"2A68" : "triple horizontal bar with double vertical stroke",
			"2A69" : "triple horizontal bar with triple vertical stroke",
			"2A6A" : "tilde operator with dot above",
			"2A6B" : "tilde operator with rising dots",
			"2A6C" : "similar minus similar",
			"2A6D" : "congruent with dot above",
			"2A6E" : "equals with asterisk",
			"2A6F" : "almost equal to with circumflex accent",
			"2A70" : "approximately equal or equal to",
			"2A71" : "equals sign above plus sign",
			"2A72" : "plus sign above equals sign",
			"2A73" : "equals sign above tilde operator",
			"2A74" : "double colon equal",
			"2A75" : "two consecutive equals signs",
			"2A76" : "three consecutive equals signs",
			"2A77" : "equals sign with two dots above and two dots below",
			"2A78" : "equivalent with four dots above",
			"2A79" : "less-than with circle inside",
			"2A7A" : "greater-than with circle inside",
			"2A7B" : "less-than with question mark above",
			"2A7C" : "greater-than with question mark above",
			"2A7D" : "less-than or slanted equal to",
			"2A7D;&#x338" : "less-than or slanted equal to with slash",
			"2A7E" : "greater-than or slanted equal to",
			"2A7E;&#x338" : "greater-than or slanted equal to with slash",
			"2A7F" : "less-than or slanted equal to with dot inside",
			"2A80" : "greater-than or slanted equal to with dot inside",
			"2A81" : "less-than or slanted equal to with dot above",
			"2A82" : "greater-than or slanted equal to with dot above",
			"2A83" : "less-than or slanted equal to with dot above right",
			"2A84" : "greater-than or slanted equal to with dot above left",
			"2A85" : "less-than or approximate",
			"2A86" : "greater-than or approximate",
			"2A89" : "less-than and not approximate",
			"2A8A" : "greater-than and not approximate",
			"2A8B" : "less-than above double-line equal above greater-than",
			"2A8C" : "greater-than above double-line equal above less-than",
			"2A8D" : "less-than above similar or equal",
			"2A8E" : "greater-than above similar or equal",
			"2A8F" : "less-than above similar above greater-than",
			"2A90" : "greater-than above similar above less-than",
			"2A91" : "less-than above greater-than above double-line equal",
			"2A92" : "greater-than above less-than above double-line equal",
			"2A93" : "less-than above slanted equal above greater-than above slanted equal",
			"2A94" : "greater-than above slanted equal above less-than above slanted equal",
			"2A95" : "slanted equal to or less-than",
			"2A96" : "slanted equal to or greater-than",
			"2A97" : "slanted equal to or less-than with dot inside",
			"2A98" : "slanted equal to or greater-than with dot inside",
			"2A99" : "double-line equal to or less-than",
			"2A9A" : "double-line equal to or greater-than",
			"2A9B" : "double-line slanted equal to or less-than",
			"2A9C" : "double-line slanted equal to or greater-than",
			"2A9D" : "similar or less-than",
			"2A9E" : "similar or greater-than",
			"2A9F" : "similar above less-than above equals sign",
			"2AA0" : "similar above greater-than above equals sign",
			"2AA1" : "double nested less-than",
			"2AA1;&#x338" : "double nested less-than with slash",
			"2AA2" : "double nested greater-than",
			"2AA2;&#x338" : "double nested greater-than with slash",
			"2AA3" : "double nested less-than with underbar",
			"2AA4" : "greater-than overlapping less-than",
			"2AA5" : "greater-than beside less-than",
			"2AA6" : "less-than closed by curve",
			"2AA7" : "greater-than closed by curve",
			"2AA8" : "less-than closed by curve above slanted equal",
			"2AA9" : "greater-than closed by curve above slanted equal",
			"2AAA" : "smaller than",
			"2AAB" : "larger than",
			"2AAC" : "smaller than or equal to",
			"2AAD" : "larger than or equal to",
			"2AAE" : "equals sign with bumpy above",
			"2AB1" : "precedes above single-line not equal to",
			"2AB2" : "succeeds above single-line not equal to",
			"2AB3" : "precedes above equals sign",
			"2AB4" : "succeeds above equals sign",
			"2AB5" : "precedes above not equal to",
			"2AB6" : "succeeds above not equal to",
			"2AB7" : "precedes above almost equal to",
			"2AB8" : "succeeds above almost equal to",
			"2AB9" : "precedes above not almost equal to",
			"2ABA" : "succeeds above not almost equal to",
			"2ABB" : "double precedes",
			"2ABC" : "double succeeds",
			"2ABD" : "subset with dot",
			"2ABE" : "superset with dot",
			"2ABF" : "subset with plus sign below",
			"2AC0" : "superset with plus sign below",
			"2AC1" : "subset with multiplication sign below",
			"2AC2" : "superset with multiplication sign below",
			"2AC3" : "subset of or equal to with dot above",
			"2AC4" : "superset of or equal to with dot above",
			"2AC5" : "subset of above equals sign",
			"2AC6" : "superset of above equals sign",
			"2AC7" : "subset of above tilde operator",
			"2AC8" : "superset of above tilde operator",
			"2AC9" : "subset of above almost equal to",
			"2ACA" : "superset of above almost equal to",
			"2ACB" : "subset of above not equal to",
			"2ACC" : "superset of above not equal to",
			"2ACD" : "square left open box operator",
			"2ACE" : "square right open box operator",
			"2ACF" : "closed subset",
			"2AD0" : "closed superset",
			"2AD1" : "closed subset or equal to",
			"2AD2" : "closed superset or equal to",
			"2AD3" : "subset above superset",
			"2AD4" : "superset above subset",
			"2AD5" : "subset above subset",
			"2AD6" : "superset above superset",
			"2AD7" : "superset beside subset",
			"2AD8" : "superset beside and joined by dash with subset",
			"2AD9" : "element of opening downwards",
			"2ADA" : "pitchfork with tee top",
			"2ADB" : "transversal intersection",
			"2ADC" : "forking",
			"2ADD" : "nonforking",
			"2ADE" : "short left tack",
			"2ADF" : "short down tack",
			"2AE0" : "short up tack",
			"2AE1" : "perpendicular with s",
			"2AE2" : "vertical bar triple right turnstile",
			"2AE3" : "double vertical bar left turnstile",
			"2AE4" : "vertical bar double left turnstile",
			"2AE5" : "double vertical bar double left turnstile",
			"2AE6" : "long dash from left member of double vertical",
			"2AE7" : "short down tack with overbar",
			"2AE8" : "short up tack with underbar",
			"2AE9" : "short up tack above short down tack",
			"2AEA" : "double down tack",
			"2AEB" : "double up tack",
			"2AEC" : "double stroke not sign",
			"2AED" : "reversed double stroke not sign",
			"2AEE" : "does not divide with reversed negation slash",
			"2AEF" : "vertical line with circle above",
			"2AF0" : "vertical line with circle below",
			"2AF1" : "down tack with circle below",
			"2AF2" : "parallel with horizontal stroke",
			"2AF3" : "parallel with tilde operator",
			"2AF4" : "triple vertical bar binary relation",
			"2AF5" : "triple vertical bar with horizontal stroke",
			"2AF6" : "triple colon operator",
			"2AF7" : "triple nested less-than",
			"2AF8" : "triple nested greater-than",
			"2AF9" : "double-line slanted less-than or equal to",
			"2AFA" : "double-line slanted greater-than or equal to",
			"2AFB" : "triple solidus binary relation",
			"2AFD" : "double solidus operator",
			"2AFE" : "white vertical bar",
			"|" : "vertical line",
			"||" : "multiple character operator: ||",
			"|||" : "multiple character operator: |||",
			"2190" : "leftwards arrow",
			"2191" : "upwards arrow",
			"2192" : "rightwards arrow",
			"2193" : "downwards arrow",
			"2194" : "left right arrow",
			"2195" : "up down arrow",
			"2196" : "north west arrow",
			"2197" : "north east arrow",
			"2198" : "south east arrow",
			"2199" : "south west arrow",
			"219A" : "leftwards arrow with stroke",
			"219B" : "rightwards arrow with stroke",
			"219C" : "leftwards wave arrow",
			"219D" : "rightwards wave arrow",
			"219E" : "leftwards two headed arrow",
			"219F" : "upwards two headed arrow",
			"21A0" : "rightwards two headed arrow",
			"21A1" : "downwards two headed arrow",
			"21A2" : "leftwards arrow with tail",
			"21A3" : "rightwards arrow with tail",
			"21A4" : "leftwards arrow from bar",
			"21A5" : "upwards arrow from bar",
			"21A6" : "rightwards arrow from bar",
			"21A7" : "downwards arrow from bar",
			"21A8" : "up down arrow with base",
			"21A9" : "leftwards arrow with hook",
			"21AA" : "rightwards arrow with hook",
			"21AB" : "leftwards arrow with loop",
			"21AC" : "rightwards arrow with loop",
			"21AD" : "left right wave arrow",
			"21AE" : "left right arrow with stroke",
			"21AF" : "downwards zigzag arrow",
			"21B0" : "upwards arrow with tip leftwards",
			"21B1" : "upwards arrow with tip rightwards",
			"21B2" : "downwards arrow with tip leftwards",
			"21B3" : "downwards arrow with tip rightwards",
			"21B4" : "rightwards arrow with corner downwards",
			"21B5" : "downwards arrow with corner leftwards",
			"21B6" : "anticlockwise top semicircle arrow",
			"21B7" : "clockwise top semicircle arrow",
			"21B8" : "north west arrow to long bar",
			"21B9" : "leftwards arrow to bar over rightwards arrow to bar",
			"21BA" : "anticlockwise open circle arrow",
			"21BB" : "clockwise open circle arrow",
			"21BC" : "leftwards harpoon with barb upwards",
			"21BD" : "leftwards harpoon with barb downwards",
			"21BE" : "upwards harpoon with barb rightwards",
			"21BF" : "upwards harpoon with barb leftwards",
			"21C0" : "rightwards harpoon with barb upwards",
			"21C1" : "rightwards harpoon with barb downwards",
			"21C2" : "downwards harpoon with barb rightwards",
			"21C3" : "downwards harpoon with barb leftwards",
			"21C4" : "rightwards arrow over leftwards arrow",
			"21C5" : "upwards arrow leftwards of downwards arrow",
			"21C6" : "leftwards arrow over rightwards arrow",
			"21C7" : "leftwards paired arrows",
			"21C8" : "upwards paired arrows",
			"21C9" : "rightwards paired arrows",
			"21CA" : "downwards paired arrows",
			"21CB" : "leftwards harpoon over rightwards harpoon",
			"21CC" : "rightwards harpoon over leftwards harpoon",
			"21CD" : "leftwards double arrow with stroke",
			"21CE" : "left right double arrow with stroke",
			"21CF" : "rightwards double arrow with stroke",
			"21D0" : "leftwards double arrow",
			"21D1" : "upwards double arrow",
			"21D2" : "rightwards double arrow",
			"21D3" : "downwards double arrow",
			"21D4" : "left right double arrow",
			"21D5" : "up down double arrow",
			"21D6" : "north west double arrow",
			"21D7" : "north east double arrow",
			"21D8" : "south east double arrow",
			"21D9" : "south west double arrow",
			"21DA" : "leftwards triple arrow",
			"21DB" : "rightwards triple arrow",
			"21DC" : "leftwards squiggle arrow",
			"21DD" : "rightwards squiggle arrow",
			"21DE" : "upwards arrow with double stroke",
			"21DF" : "downwards arrow with double stroke",
			"21E0" : "leftwards dashed arrow",
			"21E1" : "upwards dashed arrow",
			"21E2" : "rightwards dashed arrow",
			"21E3" : "downwards dashed arrow",
			"21E4" : "leftwards arrow to bar",
			"21E5" : "rightwards arrow to bar",
			"21E6" : "leftwards white arrow",
			"21E7" : "upwards white arrow",
			"21E8" : "rightwards white arrow",
			"21E9" : "downwards white arrow",
			"21EA" : "upwards white arrow from bar",
			"21EB" : "upwards white arrow on pedestal",
			"21EC" : "upwards white arrow on pedestal with horizontal bar",
			"21ED" : "upwards white arrow on pedestal with vertical bar",
			"21EE" : "upwards white double arrow",
			"21EF" : "upwards white double arrow on pedestal",
			"21F0" : "rightwards white arrow from wall",
			"21F1" : "north west arrow to corner",
			"21F2" : "south east arrow to corner",
			"21F3" : "up down white arrow",
			"21F4" : "right arrow with small circle",
			"21F5" : "downwards arrow leftwards of upwards arrow",
			"21F6" : "three rightwards arrows",
			"21F7" : "leftwards arrow with vertical stroke",
			"21F8" : "rightwards arrow with vertical stroke",
			"21F9" : "left right arrow with vertical stroke",
			"21FA" : "leftwards arrow with double vertical stroke",
			"21FB" : "rightwards arrow with double vertical stroke",
			"21FC" : "left right arrow with double vertical stroke",
			"21FD" : "leftwards open-headed arrow",
			"21FE" : "rightwards open-headed arrow",
			"21FF" : "left right open-headed arrow",
			"22B8" : "multimap",
			"27F0" : "upwards quadruple arrow",
			"27F1" : "downwards quadruple arrow",
			"27F5" : "long leftwards arrow",
			"27F6" : "long rightwards arrow",
			"27F7" : "long left right arrow",
			"27F8" : "long leftwards double arrow",
			"27F9" : "long rightwards double arrow",
			"27FA" : "long left right double arrow",
			"27FB" : "long leftwards arrow from bar",
			"27FC" : "long rightwards arrow from bar",
			"27FD" : "long leftwards double arrow from bar",
			"27FE" : "long rightwards double arrow from bar",
			"27FF" : "long rightwards squiggle arrow",
			"2900" : "rightwards two-headed arrow with vertical stroke",
			"2901" : "rightwards two-headed arrow with double vertical stroke",
			"2902" : "leftwards double arrow with vertical stroke",
			"2903" : "rightwards double arrow with vertical stroke",
			"2904" : "left right double arrow with vertical stroke",
			"2905" : "rightwards two-headed arrow from bar",
			"2906" : "leftwards double arrow from bar",
			"2907" : "rightwards double arrow from bar",
			"2908" : "downwards arrow with horizontal stroke",
			"2909" : "upwards arrow with horizontal stroke",
			"290A" : "upwards triple arrow",
			"290B" : "downwards triple arrow",
			"290C" : "leftwards double dash arrow",
			"290D" : "rightwards double dash arrow",
			"290E" : "leftwards triple dash arrow",
			"290F" : "rightwards triple dash arrow",
			"2910" : "rightwards two-headed triple dash arrow",
			"2911" : "rightwards arrow with dotted stem",
			"2912" : "upwards arrow to bar",
			"2913" : "downwards arrow to bar",
			"2914" : "rightwards arrow with tail with vertical stroke",
			"2915" : "rightwards arrow with tail with double vertical stroke",
			"2916" : "rightwards two-headed arrow with tail",
			"2917" : "rightwards two-headed arrow with tail with vertical stroke",
			"2918" : "rightwards two-headed arrow with tail with double vertical stroke",
			"2919" : "leftwards arrow-tail",
			"291A" : "rightwards arrow-tail",
			"291B" : "leftwards double arrow-tail",
			"291C" : "rightwards double arrow-tail",
			"291D" : "leftwards arrow to black diamond",
			"291E" : "rightwards arrow to black diamond",
			"291F" : "leftwards arrow from bar to black diamond",
			"2920" : "rightwards arrow from bar to black diamond",
			"2921" : "north west and south east arrow",
			"2922" : "north east and south west arrow",
			"2923" : "north west arrow with hook",
			"2924" : "north east arrow with hook",
			"2925" : "south east arrow with hook",
			"2926" : "south west arrow with hook",
			"2927" : "north west arrow and north east arrow",
			"2928" : "north east arrow and south east arrow",
			"2929" : "south east arrow and south west arrow",
			"292A" : "south west arrow and north west arrow",
			"292B" : "rising diagonal crossing falling diagonal",
			"292C" : "falling diagonal crossing rising diagonal",
			"292D" : "south east arrow crossing north east arrow",
			"292E" : "north east arrow crossing south east arrow",
			"292F" : "falling diagonal crossing north east arrow",
			"2930" : "rising diagonal crossing south east arrow",
			"2931" : "north east arrow crossing north west arrow",
			"2932" : "north west arrow crossing north east arrow",
			"2933" : "wave arrow pointing directly right",
			"2934" : "arrow pointing rightwards then curving upwards",
			"2935" : "arrow pointing rightwards then curving downwards",
			"2936" : "arrow pointing downwards then curving leftwards",
			"2937" : "arrow pointing downwards then curving rightwards",
			"2938" : "right-side arc clockwise arrow",
			"2939" : "left-side arc anticlockwise arrow",
			"293A" : "top arc anticlockwise arrow",
			"293B" : "bottom arc anticlockwise arrow",
			"293C" : "top arc clockwise arrow with minus",
			"293D" : "top arc anticlockwise arrow with plus",
			"293E" : "lower right semicircular clockwise arrow",
			"293F" : "lower left semicircular anticlockwise arrow",
			"2940" : "anticlockwise closed circle arrow",
			"2941" : "clockwise closed circle arrow",
			"2942" : "rightwards arrow above short leftwards arrow",
			"2943" : "leftwards arrow above short rightwards arrow",
			"2944" : "short rightwards arrow above leftwards arrow",
			"2945" : "rightwards arrow with plus below",
			"2946" : "leftwards arrow with plus below",
			"2947" : "rightwards arrow through x",
			"2948" : "left right arrow through small circle",
			"2949" : "upwards two-headed arrow from small circle",
			"294A" : "left barb up right barb down harpoon",
			"294B" : "left barb down right barb up harpoon",
			"294C" : "up barb right down barb left harpoon",
			"294D" : "up barb left down barb right harpoon",
			"294E" : "left barb up right barb up harpoon",
			"294F" : "up barb right down barb right harpoon",
			"2950" : "left barb down right barb down harpoon",
			"2951" : "up barb left down barb left harpoon",
			"2952" : "leftwards harpoon with barb up to bar",
			"2953" : "rightwards harpoon with barb up to bar",
			"2954" : "upwards harpoon with barb right to bar",
			"2955" : "downwards harpoon with barb right to bar",
			"2956" : "leftwards harpoon with barb down to bar",
			"2957" : "rightwards harpoon with barb down to bar",
			"2958" : "upwards harpoon with barb left to bar",
			"2959" : "downwards harpoon with barb left to bar",
			"295A" : "leftwards harpoon with barb up from bar",
			"295B" : "rightwards harpoon with barb up from bar",
			"295C" : "upwards harpoon with barb right from bar",
			"295D" : "downwards harpoon with barb right from bar",
			"295E" : "leftwards harpoon with barb down from bar",
			"295F" : "rightwards harpoon with barb down from bar",
			"2960" : "upwards harpoon with barb left from bar",
			"2961" : "downwards harpoon with barb left from bar",
			"2962" : "leftwards harpoon with barb up above leftwards harpoon with barb down",
			"2963" : "upwards harpoon with barb left beside upwards harpoon with barb right",
			"2964" : "rightwards harpoon with barb up above rightwards harpoon with barb down",
			"2965" : "downwards harpoon with barb left beside downwards harpoon with barb right",
			"2966" : "leftwards harpoon with barb up above rightwards harpoon with barb up",
			"2967" : "leftwards harpoon with barb down above rightwards harpoon with barb down",
			"2968" : "rightwards harpoon with barb up above leftwards harpoon with barb up",
			"2969" : "rightwards harpoon with barb down above leftwards harpoon with barb down",
			"296A" : "leftwards harpoon with barb up above long dash",
			"296B" : "leftwards harpoon with barb down below long dash",
			"296C" : "rightwards harpoon with barb up above long dash",
			"296D" : "rightwards harpoon with barb down below long dash",
			"296E" : "upwards harpoon with barb left beside downwards harpoon with barb right",
			"296F" : "downwards harpoon with barb left beside upwards harpoon with barb right",
			"2970" : "right double arrow with rounded head",
			"2971" : "equals sign above rightwards arrow",
			"2972" : "tilde operator above rightwards arrow",
			"2973" : "leftwards arrow above tilde operator",
			"2974" : "rightwards arrow above tilde operator",
			"2975" : "rightwards arrow above almost equal to",
			"2976" : "less-than above leftwards arrow",
			"2977" : "leftwards arrow through less-than",
			"2978" : "greater-than above rightwards arrow",
			"2979" : "subset above rightwards arrow",
			"297A" : "leftwards arrow through subset",
			"297B" : "superset above leftwards arrow",
			"297C" : "left fish tail",
			"297D" : "right fish tail",
			"297E" : "up fish tail",
			"297F" : "down fish tail",
			"2999" : "dotted fence",
			"299A" : "vertical zigzag line",
			"299B" : "measured angle opening left",
			"299C" : "right angle variant with square",
			"299D" : "measured right angle with dot",
			"299E" : "angle with s inside",
			"299F" : "acute angle",
			"29DF" : "double-ended multimap",
			"29EF" : "error-barred black square",
			"29F4" : "rule-delayed",
			"2B45" : "leftwards quadruple arrow",
			"2B46" : "rightwards quadruple arrow",
			"+" : "plus sign",
			"+" : "plus sign",
			"-" : "hyphen-minus",
			"-" : "hyphen-minus",
			"B1" : "plus-minus sign",
			"B1" : "plus-minus sign",
			"2212" : "minus sign",
			"2212" : "minus sign",
			"2213" : "minus-or-plus sign",
			"2213" : "minus-or-plus sign",
			"2214" : "dot plus",
			"229E" : "squared plus",
			"229F" : "squared minus",
			"2211" : "n-ary summation",
			"2A0A" : "modulo two sum",
			"2A0B" : "summation with integral",
			"222C" : "double integral",
			"222D" : "triple integral",
			"2295" : "circled plus",
			"2296" : "circled minus",
			"2298" : "circled division slash",
			"2A01" : "n-ary circled plus operator",
			"222B" : "integral",
			"222E" : "contour integral",
			"222F" : "surface integral",
			"2230" : "volume integral",
			"2231" : "clockwise integral",
			"2232" : "clockwise contour integral",
			"2233" : "anticlockwise contour integral",
			"2A0C" : "quadruple integral operator",
			"2A0D" : "finite part integral",
			"2A0E" : "integral with double stroke",
			"2A0F" : "integral average with slash",
			"2A10" : "circulation function",
			"2A11" : "anticlockwise integration",
			"2A12" : "line integration with rectangular path around pole",
			"2A13" : "line integration with semicircular path around pole",
			"2A14" : "line integration not including the pole",
			"2A15" : "integral around a point operator",
			"2A16" : "quaternion integral operator",
			"2A17" : "integral with leftwards arrow with hook",
			"2A18" : "integral with times sign",
			"2A19" : "integral with intersection",
			"2A1A" : "integral with union",
			"2A1B" : "integral with overbar",
			"2A1C" : "integral with underbar",
			"22C3" : "n-ary union",
			"2A03" : "n-ary union operator with dot",
			"2A04" : "n-ary union operator with plus",
			"22C0" : "n-ary logical and",
			"22C1" : "n-ary logical or",
			"22C2" : "n-ary intersection",
			"2A00" : "n-ary circled dot operator",
			"2A02" : "n-ary circled times operator",
			"2A05" : "n-ary square intersection operator",
			"2A06" : "n-ary square union operator",
			"2A07" : "two logical and operator",
			"2A08" : "two logical or operator",
			"2A09" : "n-ary times operator",
			"2AFC" : "large triple vertical bar operator",
			"2AFF" : "n-ary white vertical bar",
			"2240" : "wreath product",
			"220F" : "n-ary product",
			"2210" : "n-ary coproduct",
			"2229" : "intersection",
			"222A" : "union",
			"*" : "asterisk",
			"." : "full stop",
			"D7" : "multiplication sign",
			"2022" : "bullet",
			"2062" : "invisible times",
			"22A0" : "squared times",
			"22A1" : "squared dot operator",
			"22C5" : "dot operator",
			"2A2F" : "vector or cross product",
			"2A3F" : "amalgamation or coproduct",
			"B7" : "middle dot",
			"2297" : "circled times",
			"%" : "percent sign",
			"\"" : "reverse solidus",
			"2216" : "set minus",
			"/" : "solidus",
			"F7" : "division sign",
			"2220" : "angle",
			"2221" : "measured angle",
			"2222" : "spherical angle",
			"AC" : "not sign",
			"2299" : "circled dot operator",
			"2202" : "partial differential",
			"2207" : "nabla",
			"**" : "multiple character operator: **",
			"&lt;>" : "multiple character operator: <>",
			"^" : "circumflex accent",
			"2032" : "prime",
			"266D" : "music flat sign",
			"266E" : "music natural sign",
			"266F" : "music sharp sign",
			"!" : "exclamation mark",
			"!!" : "multiple character operator: !!",
			"//" : "multiple character operator: //",
			"@" : "commercial at",
			"?" : "question mark",
			"2145" : "double-struck italic capital d",
			"2146" : "double-struck italic small d",
			"221A" : "square root",
			"221B" : "cube root",
			"221C" : "fourth root",
			"2061" : "function application",
			"&amp" : "ampersand",
			"'" : "apostrophe",
			"++" : "multiple character operator: ++",
			"--" : "multiple character operator: --",
			"^" : "circumflex accent",
			"_" : "low line",
			"`" : "grave accent",
			"~" : "tilde",
			"A8" : "diaeresis",
			"AF" : "macron",
			"B0" : "degree sign",
			"B4" : "acute accent",
			"B8" : "cedilla",
			"2C6" : "modifier letter circumflex accent",
			"2C7" : "caron",
			"2C9" : "modifier letter macron",
			"2CA" : "modifier letter acute accent",
			"2CB" : "modifier letter grave accent",
			"2CD" : "modifier letter low macron",
			"2D8" : "breve",
			"2D9" : "dot above",
			"2DA" : "ring above",
			"2DC" : "small tilde",
			"2DD" : "double acute accent",
			"2F7" : "modifier letter low tilde",
			"302" : "combining circumflex accent",
			"311" : "combining inverted breve",
			"203E" : "overline",
			"2064" : "invisible plus",
			"20DB" : "combining three dots above",
			"20DC" : "combining four dots above",
			"23B4" : "top square bracket",
			"23B5" : "bottom square bracket",
			"23DC" : "top parenthesis",
			"23DD" : "bottom parenthesis",
			"23DE" : "top curly bracket",
			"23DF" : "bottom curly bracket",
			"23E0" : "top tortoise shell bracket",
			"23E1" : "bottom tortoise shell bracket",
			"_" : "low line"
		}

	}	

};

MathJax.Hub.Register.PreProcessor(["PreProcess",MathJax.Extension.jax2MathSpeak]);
MathJax.Ajax.loadComplete("[MathJax]/extensions/jax2MathSpeak.js");
