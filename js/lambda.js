let globalDefinitions = {
    'Y': 'λf.(λx.(f (x x))) (λx.(f (x x)))',

    'succ': 'λn.λf.λx.(f ((n f) x))',
    'add': 'λm.λn.λf.λx.((m f) ((n f) x))',
    'sub': 'λm.λn.(n pred m)',
    'mult': 'λm.λn.λf.(m (n f))',
    'pred': 'λn.λf.λx.((n (λg.λh.(h (g f)))) (λu.x) (λu.u))',

    'true': 'λx.λy.x',
    'false': 'λx.λy.y',
    'and': 'λp.λq.((p q) p)',
    'or': 'λp.λq.((p p) q)',
    'not': 'λp.λa.λb.((p b) a)',
    'if': 'λp.λa.λb.((p a) b)',
    'isnil': 'λlst.(lst (λx.false) true)',
    'iszero': 'λn.(n (λx.false) true)',

    'fact': 'Y (λf.λn.(if (iszero n) 1 (mult n (f (pred n)))))',

    'cons': 'λx.λy.λf.((f x) y)',
    'car': 'λp.(p (λx.λy.x))',
    'cdr': 'λp.(p (λx.λy.y))',
    'nil': 'λc.λn.n',
}

function highlightLambdaSyntax(text, isDark = false) {
    const parenInfo = new Array(text.length).fill(null);
    const stack = [];
    for (let j = 0; j < text.length; j++) {
        if (text[j] === '(') {
            parenInfo[j] = { status: 'ok', depth: stack.length };
            stack.push(j);
        } else if (text[j] === ')') {
            if (stack.length > 0) {
                stack.pop();
                parenInfo[j] = { status: 'ok', depth: stack.length };
            } else {
                parenInfo[j] = { status: 'error', depth: 0 };
            }
        }
    }
    while (stack.length > 0) { parenInfo[stack.pop()].status = 'error'; }

    const darkColors = {
        bracket: ['#ffffff', '#00f2ff', '#39ff14', '#ff71ff', '#ff9d00'],
        global: '#ffdc18', 
        number: '#ffe818',
        equal: '#ff00ff',
        error: '#ff4d4d'
    };

    let html = '';
    let i = 0;
    while (i < text.length) {
        const c = text[i];
        if (c === 'λ' || c === '.') {
            html += c;

        } else if (c === '=') {
            const color = isDark ? darkColors.equal : '#9b59b6'; 
            html += `<span style="color: ${color}; font-weight: bold;">=</span>`;
        } else if (c === '(' || c === ')') {
            const info = parenInfo[i];
            if (info.status === 'error') {
                html += isDark ? `<span style="color:${darkColors.error}">${c}</span>` : `<span class="syntax-error">${c}</span>`;
            } else {
                const depth = info.depth % 5;
                html += isDark ? `<span style="color:${darkColors.bracket[depth]}">${c}</span>` : `<span class="syntax-bracket-level-${depth}">${c}</span>`;
            }
        } else if (/\d/.test(c)) {
            let num = '';
            while (i < text.length && /\d/.test(text[i])) { num += text[i]; i++; }
            html += isDark ? `<span style="color:${darkColors.number}">${num}</span>` : `<span class="syntax-number">${num}</span>`;
            i--; 
        } else if (/[a-zA-Z_]/.test(c) && c !== 'λ') {
            let word = '';
            while (i < text.length && /[a-zA-Z_0-9]/.test(text[i]) && text[i] !== 'λ') { word += text[i]; i++; }
            const isGlobal = globalDefinitions[word];
            
            if (isGlobal) {
                html += isDark ? `<span style="color:${darkColors.global}; font-style:italic">${word}</span>` : `<span class="syntax-global">${word}</span>`;
            } else {
                html += word;
            }
            i--; 
        } else {
            html += c === ' ' ? ' ' : c.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        }
        i++;
    }

    if (text.endsWith('\n')) html += '<br>';

    return html;
}

function listDefinitions() {
    const outputDiv = document.getElementById('definitions');  
    let content = `<div class='globals'>`;
        
    for (const [key, value] of Object.entries(globalDefinitions)) {
        content += `<div class='definition'>
                        <div class='key-definition'><strong>${key}</strong></div> 
                        <div class='value-definition'>${highlightLambdaSyntax(value, true)}</div>
                    </div>`;
    }

    content += `</div>
                <div class="editor-wrapper">
                    <div id="global-highlight-layer" class="highlight-layer" style="grid-area: 1/1; min-height: 45px;"></div>
                    <textarea id="global-input" class="highlight-layer" spellcheck="false" placeholder="name = λexpression" 
                        style="grid-area: 1/1; min-height: 45px; color: transparent; background: transparent; caret-color: black; outline: none; z-index: 2; border: 1px solid #ccc; pointer-events: auto;"></textarea>
                </div>
                <button id="add-definition-button" style="width: 80%; margin: 10px auto; display: block;">Add Definition</button>`;
    
    outputDiv.innerHTML = content;
    
    document.getElementById('add-definition-button').addEventListener('click', addDefinition);

    const textarea = document.getElementById('global-input');
    const highlightLayer = document.getElementById('global-highlight-layer');

    const updateGlobalEditor = () => {
        let text = textarea.value;
        const cursorPosition = textarea.selectionStart;

        const updatedText = text.replace(/\blambda\b|\\/g, 'λ');
        if (updatedText !== text) {
            const adjustment = text.length - updatedText.length;
            textarea.value = updatedText;
            textarea.setSelectionRange(cursorPosition - adjustment, cursorPosition - adjustment);
            text = updatedText;
        }

        highlightLayer.innerHTML = highlightLambdaSyntax(text, false);
    };

    textarea.addEventListener('keydown', function(e) {
        if (e.key === 'Tab') {
            e.preventDefault(); 
            const start = this.selectionStart;
            const end = this.selectionEnd;
            
            this.value = this.value.substring(0, start) + '\t' + this.value.substring(end);
            
            this.selectionStart = this.selectionEnd = start + 1;
            updateGlobalEditor(); 
        } 
        else if (e.key === '(') {
            e.preventDefault(); 
            const start = this.selectionStart;
            const end = this.selectionEnd;
            const text = this.value;
            
            if (start !== end) {
                const selectedText = text.substring(start, end);
                this.value = text.substring(0, start) + '(' + selectedText + ')' + text.substring(end);
                this.selectionStart = start + 1;
                this.selectionEnd = end + 1;
            } else {
                const nextChar = text[start];
                const shouldAutoClose = !nextChar || /[\s)]/.test(nextChar);
                
                if (shouldAutoClose) {
                    this.value = text.substring(0, start) + '()' + text.substring(end);
                    this.selectionStart = this.selectionEnd = start + 1;
                } else {
                    this.value = text.substring(0, start) + '(' + text.substring(end);
                    this.selectionStart = this.selectionEnd = start + 1;
                }
            }
            updateGlobalEditor(); 
        }
    });

    textarea.addEventListener("input", updateGlobalEditor);

    updateGlobalEditor();

    attachAdvancedEditorFeatures('global-input', 'global-highlight-layer');
}

function addDefinition() {
    const input = document.getElementById('global-input').value.trim();
    const [name, expr] = input.split('=').map(part => part.trim());

    if (!name || !expr) {
        alert('Please enter a valid definition in the format: name = λexpression');
        return;
    }

    globalDefinitions[name] = expr;

    document.getElementById('global-input').value = '';
    listDefinitions();
    
    const mainEditor = document.getElementById('input');
    if (mainEditor) {
        mainEditor.dispatchEvent(new Event('input'));
    }
}

window.onload = listDefinitions;

class Term {
    toString() {
        throw new Error("Abstract method");
    }
}

class Variable extends Term {
    constructor(name) {
        super();
        this.name = name;
    }

    toString() {
        return this.name;
    }
}

class Expression extends Term {
    constructor(variable, body) {
        super();
        this.variable = variable;
        this.body = body;
    }

    toString() {
        return `λ${this.variable}.${this.body}`;
    }
}

class Application extends Term {
    constructor(func, argument) {
        super();
        this.function = func;
        this.argument = argument;
    }

    toString() {
        const funcStr = this.function instanceof Expression ? 
            `(${this.function})` : this.function.toString();
        const argStr = (this.argument instanceof Application || 
            this.argument instanceof Expression) ? 
            `(${this.argument})` : this.argument.toString();
        return `${funcStr} ${argStr}`;
    }
}

function tokenize(str) {
    const tokens = [];
    let i = 0;
    
    while (i < str.length) {
        const c = str[i];
        if (c === 'λ' || c === '.' || c === '(' || c === ')') {
            tokens.push({ type: 'symbol', value: c });
            i++;
        } else if (/\s/.test(c)) {
            // NEW: Capture the exact whitespace
            let space = '';
            while (i < str.length && /\s/.test(str[i])) {
                space += str[i];
                i++;
            }
            tokens.push({ type: 'whitespace', value: space });
        } else if (/\d/.test(c)) {
            let num = '';
            while (i < str.length && /\d/.test(str[i])) {
                num += str[i];
                i++;
            }
            tokens.push({ type: 'number', value: num });
        } else {
            let varName = '';
            while (i < str.length && !['λ', '.', '(', ')', ' '].includes(str[i]) && !/\s/.test(str[i])) {
                varName += str[i];
                i++;
            }
            tokens.push({ type: 'variable', value: varName });
        }
    }
    return tokens;
}

class Parser {
    constructor(tokens) {
        this.tokens = tokens.filter(t => t.type !== 'whitespace');
        this.pos = 0;
    }

    peek() {
        return this.tokens[this.pos] || null;
    }

    consume() {
        return this.tokens[this.pos++] || null;
    }

    parse() {
        const term = this.parseExpression();
        if (this.pos < this.tokens.length) {
            throw new Error("Unexpected tokens at the end");
        }
        return term;
    }

    parseExpression() {
        const nextToken = this.peek();
        if (nextToken && nextToken.type === 'symbol' && nextToken.value === 'λ') {
            return this.parseAbstraction();
        } else {
            return this.parseApplication();
        }
    }

    parseAbstraction() {
        const lambdaToken = this.consume(); // consume 'λ'
        if (!lambdaToken || lambdaToken.type !== 'symbol' || lambdaToken.value !== 'λ') {
            throw new Error("Expected 'λ'");
        }
        const varToken = this.consume();
        if (!varToken || varToken.type !== 'variable') {
            throw new Error("Expected variable name after 'λ'");
        }
        const variable = new Variable(varToken.value);
        const dotToken = this.consume();
        if (!dotToken || dotToken.type !== 'symbol' || dotToken.value !== '.') {
            throw new Error("Expected '.' after variable name in abstraction");
        }
        const body = this.parseExpression();
        return new Expression(variable, body);
    }

    parseApplication() {
        let left = this.parseAtom();
        while (true) {
            const nextToken = this.peek();
            if (!nextToken || (nextToken.type === 'symbol' && ['λ', '.', ')'].includes(nextToken.value))) {
                break;
            }
            const right = this.parseAtom();
            left = new Application(left, right);
        }
        return left;
    }

    parseAtom() {
        const tokenObj = this.peek();
        if (!tokenObj) {
            throw new Error("Unexpected end of input");
        }
        const { type, value } = tokenObj;
        if (type === 'symbol' && value === '(') {
            this.consume();
            const term = this.parseExpression();
            const closing = this.consume();
            if (!closing || closing.type !== 'symbol' || closing.value !== ')') {
                throw new Error("Expected ')'");
            }
            return term;
        } else if (type === 'symbol' && value === 'λ') {
            return this.parseAbstraction();
        } else if (type === 'number') {
            this.consume();
            return numToChurch(parseInt(value, 10));
        } else if (type === 'boolean') {
            this.consume();
            return booleanToChurch(value === 'true');
        } else if (type === 'variable') {
            this.consume();
            return new Variable(value);
        } else {
            throw new Error(`Unexpected token '${value}'`);
        }
    }
}


function freeVariables(term) {
    if (term instanceof Variable) {
        return new Set([term.name]);
    } else if (term instanceof Expression) {
        const bodyFv = freeVariables(term.body);
        bodyFv.delete(term.variable.name);
        return bodyFv;
    } else if (term instanceof Application) {
        const fv = freeVariables(term.function);
        freeVariables(term.argument).forEach(v => fv.add(v));
        return fv;
    }
    throw new Error("Unknown term type in free_variables");
}

let counter = 0;
function freshVariableName(base = 'x') {
    return `${base}${++counter}`;
}

function substitute(term, variable, replacement) {
    if (term instanceof Variable) {
        if (term.name === variable.name) {
            const injectedTerm = cloneTerm(replacement);
            injectedTerm._isNew = true; 
            return injectedTerm;
        }
        return term;
    } else if (term instanceof Expression) {
        if (term.variable.name === variable.name) {
            return term;
        } else if (freeVariables(replacement).has(term.variable.name) && freeVariables(term.body).has(variable.name)) {
            const newVarName = freshVariableName();
            const newVar = new Variable(newVarName);
            let newBody = substitute(term.body, term.variable, newVar);
            newBody = substitute(newBody, variable, replacement);
            return new Expression(newVar, newBody);
        } else {
            const newBody = substitute(term.body, variable, replacement);
            return new Expression(term.variable, newBody);
        }
    } else if (term instanceof Application) {
        const newFunc = substitute(term.function, variable, replacement);
        const newArg = substitute(term.argument, variable, replacement);
        return new Application(newFunc, newArg);
    }
    throw new Error("Unknown term type in substitution");
}


function parse(str) {
    const tokens = tokenize(str);
    const parser = new Parser(tokens);
    return parser.parse();
}

function expandSimpleSyntax(input, forDisplay = false, depth = 0) {
    const tokens = tokenize(input);
    const expandingTokens = new Set();

    function expandToken(tokenObj) {
        const { type, value } = tokenObj;
        
        // Pass whitespace through exactly as it was typed
        if (type === 'whitespace') return value;

        let expandedDef = null;
        let origin = value;

        if (type === 'number') {
            const num = parseInt(value, 10);
            let body = 'x';
            for (let i = 0; i < num; i++) { body = `(f ${body})`; }
            expandedDef = `(λf.λx.${body})`;
        } else if (type === 'variable' && globalDefinitions[value]) {
            if (expandingTokens.has(value)) {
                throw new Error(`Circular definition detected for token '${value}'`);
            }
            expandingTokens.add(value);
            expandedDef = expandDefinition(globalDefinitions[value], depth + 1);
            expandingTokens.delete(value);
        }

        if (expandedDef && forDisplay) {
            try {
                const termObj = parse(expandedDef);
                const beautifulTerm = toHTML(termObj, null, null, depth);
                return `<span class="highlight-expanded-group">` +
                            `<span class="expanded-origin">${origin}</span>` +
                            `<span class="expanded-term">${beautifulTerm}</span>` +
                       `</span>`;
            } catch (e) {
                return expandedDef;
            }
        }
        return expandedDef || value;
    }

    function expandDefinition(definition, d) {
        const trimmedDef = definition.trim();
        const startsWithLambda = trimmedDef.startsWith('λ');
        const expanded = expandSimpleSyntax(definition, forDisplay, d);
        return startsWithLambda ? `(${expanded})` : expanded;
    }

    // Join with NO extra spaces
    return tokens.map(expandToken).join('');
}

function showExpanded() {
    const input = document.getElementById('input').value;
    const outputDiv = document.getElementById('output');
    const errorDiv = document.getElementById('error');
    
    try {
        errorDiv.textContent = '';
        outputDiv.innerHTML = '';
        outputDiv.style.textAlign = 'left';

        const expandedHTML = expandSimpleSyntax(input, true, 0);

        outputDiv.style.textAlign = 'left'; 
        const resultDiv = document.createElement('div');
        resultDiv.className = 'final-result';
        resultDiv.style.textAlign = 'left'; // Explicitly set inside the box
        resultDiv.innerHTML = expandSimpleSyntax(input, true, 0);
        outputDiv.appendChild(resultDiv);
    } catch (error) {
        errorDiv.textContent = `Error: ${error.message}`;
        outputDiv.textContent = '';
    }
}


function getD3TreeData(term) {
    if (term instanceof Variable) {
        return { name: term.name, type: 'variable' };
    } else if (term instanceof Expression) {
        return { 
            name: `λ${term.variable.name}`, 
            type: 'lambda',
            children: [ getD3TreeData(term.body) ]
        };
    } else if (term instanceof Application) {
        return { 
            name: '@', 
            type: 'application',
            children: [ 
                getD3TreeData(term.function), 
                getD3TreeData(term.argument) 
            ]
        };
    }
    return { name: 'Unknown' };
}

function drawD3Tree(treeData, containerId) {
    const container = d3.select(containerId);
    container.selectAll("*").remove(); 

    const width = container.node().getBoundingClientRect().width || 800;
    const height = 500;
    const margin = {top: 40, right: 90, bottom: 50, left: 90};

    const svg = container.append("svg")
        .attr("width", width)
        .attr("height", height)
        .call(d3.zoom().on("zoom", (event) => {
            svgGroup.attr("transform", event.transform);
        }))
        .append("g")
        .attr("transform", `translate(${width / 2},${margin.top})`); 

    const svgGroup = svg; 

    const treemap = d3.tree().nodeSize([60, 80]); 

    let root = d3.hierarchy(treeData, d => d.children);
    root.x0 = 0;
    root.y0 = 0;

    const treeDataCalculated = treemap(root);
    const nodes = treeDataCalculated.descendants();
    const links = treeDataCalculated.descendants().slice(1);

    svgGroup.selectAll(".link")
        .data(links)
        .enter().append("path")
        .attr("class", "tree-link")
        .attr("d", d => {
            return `M${d.x},${d.y}
                    C${d.x},${(d.y + d.parent.y) / 2}
                     ${d.parent.x},${(d.y + d.parent.y) / 2}
                     ${d.parent.x},${d.parent.y}`;
        });

    const node = svgGroup.selectAll(".node")
        .data(nodes)
        .enter().append("g")
        .attr("class", d => `tree-node tree-node-${d.data.type}`)
        .attr("transform", d => `translate(${d.x},${d.y})`);

    const defs = svg.append("defs");
    const filter = defs.append("filter").attr("id", "drop-shadow");
    filter.append("feGaussianBlur").attr("in", "SourceAlpha").attr("stdDeviation", 3);
    filter.append("feOffset").attr("dx", 0).attr("dy", 2);
    filter.append("feComponentTransfer").append("feFuncA").attr("type", "linear").attr("slope", 0.3);
    const merge = filter.append("feMerge");
    merge.append("feMergeNode");
    merge.append("feMergeNode").attr("in", "SourceGraphic");

    node.append("circle")
        .attr("r", 18)
        .style("filter", "url(#drop-shadow)");

    node.append("text")
        .attr("dy", ".35em")
        .attr("text-anchor", "middle")
        .text(d => d.data.name);
}

function showSyntaxTree() {
    const input = document.getElementById('input').value;
    const outputDiv = document.getElementById('output');
    const errorDiv = document.getElementById('error');

    try {
        errorDiv.textContent = '';
        outputDiv.innerHTML = '';

        outputDiv.style.textAlign = 'left'; 

        const expressionToParse = expandSimpleSyntax(input);
        const term = parse(expressionToParse);
        const treeData = getD3TreeData(term);

        const treeDiv = document.createElement('div');
        treeDiv.id = 'd3-tree-container';
        treeDiv.className = 'ast-full-view'; 
        
        outputDiv.appendChild(treeDiv);

        drawD3Tree(treeData, "#d3-tree-container");

    } catch (error) {
        errorDiv.textContent = `Error: ${error.message}`;
        outputDiv.textContent = '';
    }
}


function getSyntaxTree(term, indent = '', isLast = true) {
    let treeStructure = '';

    if (term instanceof Variable) {
        treeStructure += `${indent}${isLast ? '└── ' : '├── '}${term.name}\n`;
    } else if (term instanceof Expression) {
        treeStructure += `${indent}${isLast ? '└── ' : '├── '}λ${term.variable.name}\n`;
        treeStructure += getSyntaxTree(term.body, indent + (isLast ? '    ' : '│   '), true);  
    } else if (term instanceof Application) {
        treeStructure += `${indent}${isLast ? '└── ' : '├── '}@\n`;
        treeStructure += getSyntaxTree(term.function, indent + (isLast ? '    ' : '│   '), false); 
        treeStructure += getSyntaxTree(term.argument, indent + (isLast ? '    ' : '│   '), true); 
    }
    
    return treeStructure;
}

function clearNewTags(term) {
    if (!term) return;
    term._isNew = false;
    if (term instanceof Expression) clearNewTags(term.body);
    if (term instanceof Application) {
        clearNewTags(term.function);
        clearNewTags(term.argument);
    }
}

function evaluate(term, maxSteps = 10000) {
    let currentTerm = term;
    let step_count = 0;
    const steps = [];
    
    while (true) {
        const redex = findNextRedex(currentTerm);
        
        let noteHtml = "Normal Form Reached";
        if (redex) {
            const varName = redex.function.variable.name;
            const argStr = redex.argument.toString(); 
            noteHtml = `Beta reduction: Substitute <span class="highlight-arg-note">${argStr}</span> for <span class="highlight-param-note">${varName}</span>`;
        }

        steps.push({
            html: toHTML(currentTerm, redex),
            text: currentTerm.toString(),
            note: noteHtml
        });

        if (!redex) break; 
        
        if (step_count >= maxSteps){
            steps.push({ 
                html: currentTerm.toString(), 
                text: currentTerm.toString(), 
                note: "<span style='color:red'>Recursion limit reached</span>" 
            });
            break;
        }

        clearNewTags(currentTerm);

        const nextTerm = reduce(currentTerm);
        if (nextTerm.toString() === currentTerm.toString()) break; 

        currentTerm = nextTerm;
        step_count++;
    }

    return { steps, finalTerm: currentTerm };
}

function cloneTerm(term) {
    if (term instanceof Variable) {
        return new Variable(term.name);
    } else if (term instanceof Expression) {
        return new Expression(new Variable(term.variable.name), cloneTerm(term.body));
    } else if (term instanceof Application) {
        return new Application(cloneTerm(term.function), cloneTerm(term.argument));
    }
    throw new Error("Unknown term type in cloneTerm");
}

function reduce(term) {
    if (term instanceof Application) {
        if (term.function instanceof Expression) {
            return substitute(term.function.body, term.function.variable, term.argument);
        } else {
            const reducedFunc = reduce(term.function);
            if (reducedFunc !== term.function) {
                return new Application(reducedFunc, term.argument);
            } else {
                const reducedArg = reduce(term.argument);
                if (reducedArg !== term.argument) {
                    return new Application(term.function, reducedArg);
                } else {
                    return term;
                }
            }
        }
    } else if (term instanceof Expression) {
        const reducedBody = reduce(term.body);
        if (reducedBody !== term.body) {
            return new Expression(term.variable, reducedBody);
        } else {
            return term;
        }
    } else {
        return term;
    }
}

// // Update the evaluate function to use the single-step reduction
// function evaluate(term, maxSteps = 10) {
//     let currentTerm = term;
//     const steps = [currentTerm.toString()];
    
//     for (let step = 0; step < maxSteps; step++) {
//         const nextTerm = reduceOnce(currentTerm);
//         if (nextTerm.toString() === currentTerm.toString()) {
//             break; // Normal form reached
//         }
//         steps.push(nextTerm.toString());
//         currentTerm = nextTerm;
//     }
    
//     if (maxSteps > 0 && steps.length === maxSteps) {
//         steps.push("Infinite recursion reached");
//     }
    
//     return steps;
// }





function evaluateExpression() {
    counter = 0;
    const input = document.getElementById('input').value;
    const outputDiv = document.getElementById('output');
    const errorDiv = document.getElementById('error');

    function renderStepsUI(stepsArray, finalTerm) {
        outputDiv.innerHTML = '';
        const container = document.createElement('div');
        container.className = 'steps-container';

        stepsArray.forEach((step, index) => {
            const stepDiv = document.createElement('div');
            stepDiv.className = 'step-row';
            stepDiv.innerHTML = `
                <div class="step-number">${index + 1}</div>
                <div class="step-content"><div class="step-math">${step.html}</div></div>
            `;
            container.appendChild(stepDiv);

            if (index < stepsArray.length - 1) {
                const arrowDiv = document.createElement('div');
                arrowDiv.className = 'transition-arrow';
                arrowDiv.innerHTML = `
                    <div class="arrow-graphic">
                        <div class="arrow-line"></div>
                        <div class="arrow-symbol">${step.note.includes("Beta") ? "β" : "↓"}</div>
                        <div class="arrow-head">▼</div>
                    </div>
                    <div class="arrow-note">${step.note}</div>
                `;
                container.appendChild(arrowDiv);
            }
        });

        outputDiv.appendChild(container);
        
        const hideBtn = document.createElement('button');
        hideBtn.textContent = 'Hide Evaluation Steps';

        hideBtn.onclick = () => showFinalResult(stepsArray, finalTerm);
        outputDiv.appendChild(hideBtn);
    }

    function showFinalResult(stepsArray, finalTerm) {
        outputDiv.innerHTML = '';
        
        const resultContainer = document.createElement('div');
        resultContainer.className = 'final-result-container'; 

        const decimalValue = churchToNum(finalTerm);
        if (decimalValue !== null) {
            const badge = document.createElement('div');
            badge.className = 'decimal-badge';
            badge.innerHTML = `<strong>${decimalValue}</strong>`;
            resultContainer.appendChild(badge);
        }

        const resultDiv = document.createElement('div');
        resultDiv.className = 'final-result';
        resultDiv.innerHTML = toHTML(finalTerm, null, null, 0, false); 
        resultContainer.appendChild(resultDiv);
        
        outputDiv.appendChild(resultContainer);
        
        const showBtn = document.createElement('button');
        showBtn.textContent = 'Show Evaluation Steps';
        showBtn.onclick = () => renderStepsUI(stepsArray, finalTerm);
        
        outputDiv.appendChild(document.createElement('br'));
        outputDiv.appendChild(showBtn);
    }

    try {
        errorDiv.textContent = '';
        outputDiv.style.textAlign = 'center';

        let expressionToEvaluate = expandSimpleSyntax(input);
        const term = parse(expressionToEvaluate);
        
        // Capture both from the evaluate result
        const { steps, finalTerm } = evaluate(term);
        
        showFinalResult(steps, finalTerm);
    } catch (error) {
        errorDiv.textContent = `Error: ${error.message}`;
        outputDiv.textContent = '';
    }
}



let currentMode = 'simple';

function setMode(mode) {
    currentMode = mode;
    document.getElementById('simpleTab').classList.toggle('active', mode === 'simple');
    document.getElementById('advancedTab').classList.toggle('active', mode === 'advanced');
    document.getElementById('input').placeholder = mode === 'simple' ? 
        "Enter expression (e.g., 'add 1 2')" : 
        "Enter lambda calculus expression (e.g., 'λx.x')";
}

/**
 * 
 * Some helper functions to make things a bit easier
 * for the user.
 * 
 */

function booleanToChurch(bool) {
    const x = new Variable('x');
    const y = new Variable('y');
    return new Expression(x, new Expression(y, bool ? x : y));
}

function numToChurch(num) {
    const f = new Variable('f');
    const x = new Variable('x');
    let body = x;
    for (let i = 0; i < num; i++) {
        body = new Application(f, body);
    }
    return new Expression(f, new Expression(x, body));
}

function churchToNum(term) {
    // 1. Must be an abstraction: λf.body
    if (!(term instanceof Expression)) return null;
    const f = term.variable.name;
    
    // 2. Body must be an abstraction: λx.innerBody
    if (!(term.body instanceof Expression)) return null;
    const x = term.body.variable.name;
    
    let current = term.body.body;
    let count = 0;

    // 3. Traverse the applications: (f (f (f x)))
    while (current instanceof Application) {
        // The function being applied must be the first bound variable (f)
        if (!(current.function instanceof Variable) || current.function.name !== f) {
            return null;
        }
        current = current.argument;
        count++;
    }

    // 4. The final innermost atom must be the second bound variable (x)
    if (current instanceof Variable && current.name === x) {
        return count;
    }

    return null;
}




function findNextRedex(term) {
    if (term instanceof Application) {
        if (term.function instanceof Expression) {
            return term; 
        }
        const leftSearch = findNextRedex(term.function);
        if (leftSearch) return leftSearch;
        
        return findNextRedex(term.argument);
    } else if (term instanceof Expression) {
        return findNextRedex(term.body);
    }
    return null;
}

function toHTML(term, targetRedex = null, boundVarToHighlight = null, depth = 0, showChanged = true) {
    const levelClass = `bracket-level-${depth % 5}`;
    let resultHTML = "";

    if (term === targetRedex) {
        const func = term.function;
        const arg = term.argument;
        const varName = func.variable.name;
        
        const paramHtml = `<span class="highlight-param">${varName}</span>`;
        const bodyHtml = toHTML(func.body, null, varName, depth + 1, showChanged); 
        
        let funcHtml = `<span class="${levelClass}">(</span>λ${paramHtml}.${bodyHtml}<span class="${levelClass}">)</span>`;
        if (func._isNew && showChanged) {
            funcHtml = `<span class="highlight-changed">${funcHtml}</span>`;
        }

        const argHtmlInner = toHTML(arg, null, null, depth + 1, showChanged); 
        let argHtml = (arg instanceof Application || arg instanceof Expression) ? 
            `<span class="${levelClass}">(</span><span class="highlight-arg">${argHtmlInner}</span><span class="${levelClass}">)</span>` : 
            `<span class="highlight-arg">${argHtmlInner}</span>`;

        if (arg._isNew && showChanged) {
            argHtml = `<span class="highlight-changed">${argHtml}</span>`;
        }
        
        resultHTML = `<span class="redex-wrapper">${funcHtml} ${argHtml}</span>`;
    } else if (term instanceof Variable) {
        resultHTML = term.name === boundVarToHighlight ? `<span class="highlight-bound">${term.name}</span>` : term.name;
    } else if (term instanceof Expression) {
        const nextBoundVar = (term.variable.name === boundVarToHighlight) ? null : boundVarToHighlight;
        resultHTML = `λ${term.variable.name}.${toHTML(term.body, targetRedex, nextBoundVar, depth, showChanged)}`;
    } else if (term instanceof Application) {
        const funcStr = term.function instanceof Expression ? 
            `<span class="${levelClass}">(</span>${toHTML(term.function, targetRedex, boundVarToHighlight, depth + 1, showChanged)}<span class="${levelClass}">)</span>` : 
            toHTML(term.function, targetRedex, boundVarToHighlight, depth, showChanged);
        const argStr = (term.argument instanceof Application || term.argument instanceof Expression) ? 
            `<span class="${levelClass}">(</span>${toHTML(term.argument, targetRedex, boundVarToHighlight, depth + 1, showChanged)}<span class="${levelClass}">)</span>` : 
            toHTML(term.argument, targetRedex, boundVarToHighlight, depth, showChanged);
        resultHTML = `${funcStr} ${argStr}`;
    }

    if (term._isNew && showChanged) {
        return `<span class="highlight-changed">${resultHTML}</span>`;
    }
    
    return resultHTML;
}

function getReductionInfo(term) {
    if (term instanceof Application && term.function instanceof Expression) {
        return { type: 'Beta Reduction', redex: term };
    }
    return { type: 'Normal Form Reached', redex: null };
}


function toDisplayFormat(term, highlights = {}, isIntermediateParameter = false) {
    if (term instanceof Variable) {
        const cls = isIntermediateParameter ? 'parameter highlight parameter-visual' : 'variable highlight variable-visual';
        return highlights[term.name] ? `<span class='${cls}'>${term.name}</span>` : term.name;
    } else if (term instanceof Expression) {
        const paramStr = toDisplayFormat(term.variable, highlights, isIntermediateParameter);
        const bodyStr = toDisplayFormat(term.body, highlights);
        return `λ${paramStr}.${bodyStr}`;
    } else if (term instanceof Application) {
        const funcStr = term.function instanceof Expression ? `(${toDisplayFormat(term.function, highlights)})` : toDisplayFormat(term.function, highlights);
        const argStr = (term.argument instanceof Application || term.argument instanceof Expression) ? `(${toDisplayFormat(term.argument, highlights)})` : toDisplayFormat(term.argument, highlights);
        const highlightedArgStr = `<span class='argument highlight argument-visual'>${argStr}</span>`;
        return `${funcStr} ${highlightedArgStr}`;
    }
}

function attachAdvancedEditorFeatures(textareaId, highlightLayerId) {
    const textarea = document.getElementById(textareaId);
    const highlightLayer = document.getElementById(highlightLayerId);
    if (!textarea || !highlightLayer) return;

    textarea.style.tabSize = '4';
    highlightLayer.style.tabSize = '4';

    const wrapper = textarea.parentElement;

    let lineNumbers = wrapper.querySelector('.line-numbers-gutter');
    if (!lineNumbers) {
        lineNumbers = document.createElement('div');
        lineNumbers.className = 'line-numbers-gutter';
        
        lineNumbers.style.cssText = `
            grid-area: 1/1;
            width: 35px;
            padding: 10px 0;
            text-align: center;
            color: #888;
            border-right: 1px solid #ddd;
            background: transparent;
            font-family: monospace;
            font-size: 16px;
            line-height: 20px;
            user-select: none;
            pointer-events: none;
            z-index: 3;
            overflow: hidden;
            box-sizing: border-box;
            display: none;
        `;
        wrapper.insertBefore(lineNumbers, highlightLayer);
    }

    const syncScroll = () => {
        // Force all layers to perfectly mirror the textarea's scroll position
        if (lineNumbers) lineNumbers.scrollTop = textarea.scrollTop;
        if (highlightLayer) {
            highlightLayer.scrollTop = textarea.scrollTop;
            highlightLayer.scrollLeft = textarea.scrollLeft;
        }
    };

    const updateFeatures = () => {
        // 1. Cache the current scroll position so we don't lose it
        const currentScrollTop = textarea.scrollTop;
        const currentScrollLeft = textarea.scrollLeft;

        // 2. Briefly shrink to calculate true scrollHeight
        textarea.style.height = '45px'; 
        
        const maxHeight = 160;
        const scrollH = textarea.scrollHeight;
        const newHeight = Math.min(Math.max(scrollH, 45), maxHeight);
        
        // 3. Apply the new height
        textarea.style.height = newHeight + 'px';
        highlightLayer.style.height = newHeight + 'px';
        lineNumbers.style.height = newHeight + 'px';
        
        textarea.style.overflowY = scrollH > maxHeight ? 'auto' : 'hidden';

        // 4. Line Numbers Logic
        const lines = textarea.value.split('\n').length;
        if (lines > 1) {
            lineNumbers.style.display = 'block';
            textarea.style.paddingLeft = '45px';
            highlightLayer.style.paddingLeft = '45px';
            
            let numbersHtml = '';
            for (let l = 1; l <= lines; l++) {
                numbersHtml += l + '<br>';
            }
            lineNumbers.innerHTML = numbersHtml;
        } else {
            lineNumbers.style.display = 'none';
            textarea.style.paddingLeft = '10px';
            highlightLayer.style.paddingLeft = '10px';
        }
        
        // 5. Restore the cached scroll positions and sync!
        textarea.scrollTop = currentScrollTop;
        textarea.scrollLeft = currentScrollLeft;
        syncScroll();
    };

    textarea.addEventListener('input', updateFeatures);
    
    // Centralized scroll sync listener
    textarea.addEventListener('scroll', syncScroll);

    setTimeout(updateFeatures, 0);
}
document.addEventListener("DOMContentLoaded", () => {
    const textarea = document.getElementById('input');
    const highlightLayer = document.getElementById('highlight-layer');

    function updateEditor() {
        let text = textarea.value;

        // 1. Lambda auto-replace
        const cursorPosition = textarea.selectionStart;
        const beforeCursor = text.slice(0, cursorPosition);
        const afterCursor = text.slice(cursorPosition);
        const updatedBeforeCursor = beforeCursor.replace(/\blambda\b|\\/g, 'λ');
        const updatedText = updatedBeforeCursor + afterCursor;
        const adjustment = beforeCursor.length - updatedBeforeCursor.length;

        if (updatedText !== text) {
            textarea.value = updatedText;
            textarea.setSelectionRange(cursorPosition - adjustment, cursorPosition - adjustment);
            text = updatedText;
        }

        // --- RAINBOW BRACKET PRE-PASS ---
        const parenInfo = new Array(text.length).fill(null);
        const stack = [];
        
        for (let j = 0; j < text.length; j++) {
            if (text[j] === '(') {
                // Store depth BEFORE pushing (starts at 0)
                parenInfo[j] = { status: 'ok', depth: stack.length };
                stack.push(j);
            } else if (text[j] === ')') {
                if (stack.length > 0) {
                    stack.pop();
                    // Depth is the size of the stack AFTER popping to match the pair
                    parenInfo[j] = { status: 'ok', depth: stack.length };
                } else {
                    parenInfo[j] = { status: 'error', depth: 0 };
                }
            }
        }
        while (stack.length > 0) {
            parenInfo[stack.pop()].status = 'error';
        }

        // 2. Generate HTML
        let html = '';
        let i = 0;
        while (i < text.length) {
            const c = text[i];
            if (c === 'λ') {
                html += '<span class="syntax-lambda">λ</span>';
            } else if (c === '.') {
                html += '<span class="syntax-dot">.</span>';
            } else if (c === '(' || c === ')') {
                const info = parenInfo[i];
                if (info.status === 'error') {
                    html += `<span class="syntax-error">${c}</span>`;
                } else {
                    // Cycle through 5 levels of colors
                    const level = info.depth % 5;
                    html += `<span class="syntax-bracket-level-${level}">${c}</span>`;
                }
            } else if (/\d/.test(c)) {
                let num = '';
                while (i < text.length && /\d/.test(text[i])) { num += text[i]; i++; }
                html += `<span class="syntax-number">${num}</span>`;
                i--; 
            } else if (/[a-zA-Z_+\-&|*/<>=!?]/.test(c) && c !== 'λ') {
                let word = '';
                while (i < text.length && /[a-zA-Z_0-9+\-&|*/<>=!?]/.test(text[i]) && text[i] !== 'λ') { word += text[i]; i++; }
                const cls = globalDefinitions[word] ? "syntax-global" : "syntax-variable";
                html += `<span class="${cls}">${word}</span>`;
                i--; 
            } else if (c === ' ') {
                html += ' ';
            } else {
                html += c.replace(/</g, '&lt;').replace(/>/g, '&gt;');
            }
            i++;
        }
        if (text.endsWith('\n')) html += '<br>';
        highlightLayer.innerHTML = html;
    }

    textarea.addEventListener('keydown', function(e) {
        if (e.key === 'Tab') {
            e.preventDefault(); 
            const start = this.selectionStart;
            const end = this.selectionEnd;
            this.value = this.value.substring(0, start) + '\t' + this.value.substring(end);
            this.selectionStart = this.selectionEnd = start + 1;
            updateEditor(); 
        } 
        else if (e.key === '(') {
            e.preventDefault(); 
            const start = this.selectionStart;
            const end = this.selectionEnd;
            const text = this.value;
            
            if (start !== end) {
                const selectedText = text.substring(start, end);
                this.value = text.substring(0, start) + '(' + selectedText + ')' + text.substring(end);
                this.selectionStart = start + 1;
                this.selectionEnd = end + 1;
            } else {
                const nextChar = text[start];
                const shouldAutoClose = !nextChar || /[\s)]/.test(nextChar);
                
                if (shouldAutoClose) {
                    this.value = text.substring(0, start) + '()' + text.substring(end);
                    this.selectionStart = this.selectionEnd = start + 1;
                } else {
                    this.value = text.substring(0, start) + '(' + text.substring(end);
                    this.selectionStart = this.selectionEnd = start + 1;
                }
            }
            updateEditor(); 
        }
    });

    textarea.addEventListener("input", updateEditor);
    
    updateEditor();

    attachAdvancedEditorFeatures('input', 'highlight-layer');
});

