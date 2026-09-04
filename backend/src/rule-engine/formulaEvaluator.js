/**
 * Safe Mathematical Expression Evaluator for METRIX-R76 OIML Rule Engine
 * Does NOT use eval() or arbitrary JS execution.
 * Supports: +, -, *, /, (, ), abs(), min(), max(), round(), numbers and variables.
 */

function tokenize(expression) {
  const tokens = [];
  let i = 0;
  const str = expression.replace(/\s+/g, '');

  while (i < str.length) {
    const char = str[i];

    if ('+-*/(),'.includes(char)) {
      tokens.push({ type: 'PUNCT', value: char });
      i++;
    } else if (char === '<' || char === '>' || char === '=' || char === '!') {
      let op = char;
      if (i + 1 < str.length && str[i + 1] === '=') {
        op += '=';
        i++;
      }
      tokens.push({ type: 'COMP', value: op });
      i++;
    } else if (char === '?') {
      tokens.push({ type: 'PUNCT', value: '?' });
      i++;
    } else if (char === ':') {
      tokens.push({ type: 'PUNCT', value: ':' });
      i++;
    } else if (/[0-9.]/.test(char)) {
      let numStr = '';
      while (i < str.length && /[0-9.]/.test(str[i])) {
        numStr += str[i];
        i++;
      }
      tokens.push({ type: 'NUMBER', value: parseFloat(numStr) });
    } else if (/[a-zA-Z_]/.test(char)) {
      let idStr = '';
      while (i < str.length && /[a-zA-Z0-9_]/.test(str[i])) {
        idStr += str[i];
        i++;
      }
      tokens.push({ type: 'IDENT', value: idStr });
    } else {
      throw new Error(`Unexpected character in formula: ${char}`);
    }
  }

  return tokens;
}

class SafeParser {
  constructor(tokens, variables = {}) {
    this.tokens = tokens;
    this.variables = variables;
    this.pos = 0;
  }

  peek() {
    return this.tokens[this.pos];
  }

  consume(expectedValue = null) {
    const token = this.tokens[this.pos];
    if (!token) throw new Error('Unexpected end of expression');
    if (expectedValue && token.value !== expectedValue) {
      throw new Error(`Expected '${expectedValue}' but found '${token.value}'`);
    }
    this.pos++;
    return token;
  }

  parse() {
    const res = this.parseExpression();
    if (this.pos < this.tokens.length) {
      throw new Error(`Unexpected token at end: ${this.peek().value}`);
    }
    return res;
  }

  parseExpression() {
    return this.parseTernary();
  }

  parseTernary() {
    let cond = this.parseComparison();
    if (this.peek() && this.peek().value === '?') {
      this.consume('?');
      const trueVal = this.parseExpression();
      this.consume(':');
      const falseVal = this.parseExpression();
      return cond ? trueVal : falseVal;
    }
    return cond;
  }

  parseComparison() {
    let left = this.parseAddSub();
    if (this.peek() && this.peek().type === 'COMP') {
      const op = this.consume().value;
      const right = this.parseAddSub();
      if (op === '<') return left < right ? 1 : 0;
      if (op === '<=') return left <= right ? 1 : 0;
      if (op === '>') return left > right ? 1 : 0;
      if (op === '>=') return left >= right ? 1 : 0;
      if (op === '==' || op === '=') return left === right ? 1 : 0;
      if (op === '!=') return left !== right ? 1 : 0;
    }
    return left;
  }

  parseAddSub() {
    let left = this.parseMulDiv();

    while (this.peek() && (this.peek().value === '+' || this.peek().value === '-')) {
      const op = this.consume().value;
      const right = this.parseMulDiv();
      if (op === '+') left += right;
      else left -= right;
    }

    return left;
  }

  parseMulDiv() {
    let left = this.parseUnary();

    while (this.peek() && (this.peek().value === '*' || this.peek().value === '/')) {
      const op = this.consume().value;
      const right = this.parseUnary();
      if (op === '*') left *= right;
      else {
        if (right === 0) throw new Error('Division by zero in formula evaluation');
        left /= right;
      }
    }

    return left;
  }

  parseUnary() {
    if (this.peek() && this.peek().value === '-') {
      this.consume('-');
      return -this.parseUnary();
    }
    if (this.peek() && this.peek().value === '+') {
      this.consume('+');
      return this.parseUnary();
    }
    return this.parsePrimary();
  }

  parsePrimary() {
    const token = this.peek();
    if (!token) throw new Error('Unexpected end of expression');

    if (token.type === 'NUMBER') {
      this.consume();
      return token.value;
    }

    if (token.type === 'PUNCT' && token.value === '(') {
      this.consume('(');
      const val = this.parseExpression();
      this.consume(')');
      return val;
    }

    if (token.type === 'IDENT') {
      const name = this.consume().value;

      // Function calls: abs, min, max, round
      if (this.peek() && this.peek().value === '(') {
        this.consume('(');
        const args = [];
        if (this.peek() && this.peek().value !== ')') {
          args.push(this.parseExpression());
          while (this.peek() && this.peek().value === ',') {
            this.consume(',');
            args.push(this.parseExpression());
          }
        }
        this.consume(')');

        if (name === 'abs') return Math.abs(args[0] || 0);
        if (name === 'min') return Math.min(...args);
        if (name === 'max') return Math.max(...args);
        if (name === 'round') return Math.round(args[0] || 0);

        throw new Error(`Unsupported math function: ${name}`);
      }

      // Variable lookup
      if (Object.prototype.hasOwnProperty.call(this.variables, name)) {
        const val = this.variables[name];
        if (typeof val === 'number' && !isNaN(val)) return val;
        throw new Error(`Variable '${name}' must be a valid number (got ${val})`);
      }

      throw new Error(`Unknown variable in formula: '${name}'`);
    }

    throw new Error(`Unexpected token: ${token.value}`);
  }
}

function evaluateFormula(expression, variables = {}) {
  try {
    const tokens = tokenize(expression);
    const parser = new SafeParser(tokens, variables);
    const result = parser.parse();
    // Return rounded to 6 decimals to avoid floating point precision artifacts
    return Math.round(result * 1e6) / 1e6;
  } catch (err) {
    throw new Error(`Formula evaluation error for '${expression}': ${err.message}`);
  }
}

module.exports = {
  evaluateFormula
};
