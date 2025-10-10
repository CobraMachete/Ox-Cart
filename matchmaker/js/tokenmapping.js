/**
 * Replace ${TOKEN} placeholders in *template* using values from *vars*.
 *
 * @param {string} template
 * @param {Record<string, any>} vars         // e.g. { TRICODEAWAY: 'ATL', TRICODEHOME: 'NYK' }
 * @param {{ onMissing?: 'leave'|'empty'|'throw' }} [opts]
 * @returns {string}
 */
function replaceTokens(template, vars, opts = {}) {
  const onMissing = opts.onMissing ?? 'leave'; // 'leave' | 'empty' | 'throw'
  const re = /\$\{([A-Z0-9_]+)\}/g;            // ${UPPER_SNAKE}

  return String(template).replace(re, (_, key) => {
    // Only accept own keys (no prototype pollution)
    if (Object.prototype.hasOwnProperty.call(vars, key)) {
      const v = vars[key];
      return v === null || v === undefined ? '' : String(v);
    }

    if (onMissing === 'empty') return '';
    if (onMissing === 'throw') {
      throw new Error(`Missing token value for ${key}`);
    }
    // default: leave the placeholder untouched so you can see what's missing
    return `\$\{${key}\}`;
  });
}

// ---------- Examples ----------
// const vars = { TRICODEAWAY: 'ATL', TRICODEHOME: 'NYK' };

// console.log(replaceTokens('${TRICODEAWAY}_SHOT_02', vars));


// console.log(replaceTokens('${TRICODEAWAY}_${TRICODEHOME}', vars));


// console.log(replaceTokens('Hello ${MISSING}', vars, { onMissing: 'empty' }));



function buildVarsFromUI(row) {
    let state = row.currentIcon.state;
  return {
    TRICODEAWAY: row.awayTricode,
    TRICODEHOME: row.homeTricode,
    SCHOOLHOME: row.homeSchool,
    SCHOOLAWAY: row.awaySchool,
    DATE: row.calText,
    TOD: state.toUpperCase()
    
  };
}

// const template = '${TRICODEAWAY}_SHOT_02';
// const output = replaceTokens(template, buildVarsFromUI());
