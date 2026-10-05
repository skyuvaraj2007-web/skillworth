/**
 * SKILL NEXUS — Supabase Query Adapter
 * Translates PostgreSQL SQL operations to Supabase PostgREST client calls.
 * Enables full Supabase-native execution with zero direct PostgreSQL dependencies.
 */

const { supabase } = require('../config/supabase');

class SupabaseQueryAdapter {
  constructor(client = supabase) {
    this.client = client;
  }

  /**
   * Main query entry point mimicking pg.Pool.query / pg.Client.query.
   * Returns { rows: [...], rowCount: n, command: '...' }
   */
  async query(sqlText, params = []) {
    if (!sqlText || typeof sqlText !== 'string') {
      return { rows: [], rowCount: 0 };
    }

    const trimmed = sqlText.trim();
    const verb = trimmed.split(/\s+/)[0].toUpperCase();

    // Handle transaction control statements
    if (['BEGIN', 'COMMIT', 'ROLLBACK', 'SAVEPOINT'].includes(verb)) {
      return { rows: [], rowCount: 0, command: verb };
    }

    try {
      if (verb === 'SELECT' || trimmed.startsWith('WITH')) {
        return await this._handleSelect(trimmed, params);
      } else if (verb === 'INSERT') {
        return await this._handleInsert(trimmed, params);
      } else if (verb === 'UPDATE') {
        return await this._handleUpdate(trimmed, params);
      } else if (verb === 'DELETE') {
        return await this._handleDelete(trimmed, params);
      }
    } catch (err) {
      if (err && (err.code === 'PGRST205' || (err.message && err.message.includes('Could not find the table')))) {
        const table = (err.hint && err.hint.match(/table 'public\.([a-zA-Z0-9_]+)'/)?.[1]) || 'relation';
        const normErr = new Error(`relation "${table}" does not exist`);
        normErr.code = '42P01';
        throw normErr;
      }
      console.warn(`[SupabaseQueryAdapter] Query error on ${verb}:`, err.message);
      throw err;
    }

    return { rows: [], rowCount: 0 };
  }

  /**
   * Mimics pg.Pool.connect() returning a mock client with query() and release()
   */
  async connect() {
    return {
      query: (sql, params) => this.query(sql, params),
      release: () => {}
    };
  }

  /**
   * Resolves $1, $2, etc. placeholders with provided parameters.
   */
  _resolveParam(paramIdx, params) {
    const idx = parseInt(paramIdx, 10) - 1;
    return params && idx >= 0 && idx < params.length ? params[idx] : null;
  }

  _normalizeUuidParam(col, val) {
    if (!col || val === null || val === undefined) return val;
    const isIdCol = col === 'id' || col.endsWith('_id');
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(val));
    if (isIdCol && !isUuid) {
      return '__SKIP_INVALID_UUID__';
    }
    return val;
  }

  async _ensureCodeMap() {
    if (this._codeToUuidMap) return;
    this._codeToUuidMap = new Map();
    try {
      const [instRes, compRes] = await Promise.all([
        this.client.from('institutions').select('id, code').limit(500),
        this.client.from('companies').select('id, registration_number').limit(500)
      ]);
      if (instRes.data) {
        for (const i of instRes.data) {
          if (i.code) this._codeToUuidMap.set(i.code, i.id);
        }
      }
      if (compRes.data) {
        for (const c of compRes.data) {
          if (c.registration_number) this._codeToUuidMap.set(c.registration_number, c.id);
        }
      }
    } catch {}
  }

  _normalizeUuidParam(col, val) {
    if (!val || typeof val !== 'string') return val;
    const uuidCols = ['id', 'institution_id', 'college_id', 'company_id', 'department_id', 'class_id', 'academician_id', 'student_id', 'user_id', 'opportunity_id', 'application_id'];
    if (uuidCols.includes(col) || (col.endsWith('_id') && col !== 'roll_number')) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
      if (!isUuid) {
        if (this._codeToUuidMap && this._codeToUuidMap.has(val)) {
          return this._codeToUuidMap.get(val);
        }
        return '__SKIP_INVALID_UUID__';
      }
    }
    return val;
  }

  _parseTopLevelSql(sql) {
    let depth = 0;
    let mainFromIdx = -1;
    let tableName = null;
    let tableAlias = null;

    for (let i = 0; i < sql.length; i++) {
      const ch = sql[i];
      if (ch === '(') depth++;
      else if (ch === ')') depth--;
      else if (depth === 0) {
        const rest = sql.slice(i);
        if (mainFromIdx === -1) {
          const m = rest.match(/^FROM\s+([a-zA-Z0-9_]+)(?:\s+(?:AS\s+)?([a-zA-Z0-9_]+))?/i);
          if (m) {
            tableName = m[1].toLowerCase();
            tableAlias = m[2] ? m[2].toLowerCase() : null;
            mainFromIdx = i;
            i += m[0].length - 1;
          }
        }
      }
    }

    if (!tableName) {
      const fallback = sql.match(/FROM\s+([a-zA-Z0-9_]+)(?:\s+(?:AS\s+)?([a-zA-Z0-9_]+))?/i);
      tableName = fallback ? fallback[1].toLowerCase() : null;
      tableAlias = fallback && fallback[2] ? fallback[2].toLowerCase() : null;
    }

    const afterFrom = mainFromIdx !== -1 ? sql.slice(mainFromIdx) : sql;

    let whereClause = null;
    let orderExpr = null;
    let limitVal = null;

    depth = 0;
    let whereStart = -1;
    for (let i = 0; i < afterFrom.length; i++) {
      const ch = afterFrom[i];
      if (ch === '(') depth++;
      else if (ch === ')') depth--;
      else if (depth === 0) {
        const rest = afterFrom.slice(i);
        if (whereStart === -1) {
          const wm = rest.match(/^WHERE\s+/i);
          if (wm) {
            whereStart = i + wm[0].length;
            i += wm[0].length - 1;
            continue;
          }
        } else if (whereStart !== -1 && !whereClause) {
          const stop = rest.match(/^(?:GROUP\s+BY|ORDER\s+BY|LIMIT|HAVING)/i);
          if (stop) {
            whereClause = afterFrom.slice(whereStart, i).trim();
          }
        }

        if (!orderExpr) {
          const om = rest.match(/^ORDER\s+BY\s+([\s\S]+?)(?=\s+(?:LIMIT|OFFSET|$))/i);
          if (om) {
            orderExpr = om[1].trim();
          }
        }

        if (!limitVal) {
          const lm = rest.match(/^LIMIT\s+(\d+|\$\d+)/i);
          if (lm) {
            limitVal = lm[1];
          }
        }
      }
    }

    if (whereStart !== -1 && !whereClause) {
      whereClause = afterFrom.slice(whereStart).trim();
    }

    return { tableName, tableAlias, whereClause, orderExpr, limitVal };
  }

  /**
   * Handles SELECT queries
   */
  async _handleSelect(sql, params) {
    await this._ensureCodeMap();

    const { tableName, tableAlias, whereClause, orderExpr, limitVal } = this._parseTopLevelSql(sql);
    if (!tableName) {
      return { rows: [], rowCount: 0 };
    }

    // Build PostgREST query
    let q = this.client.from(tableName).select('*');

    // Parse WHERE clause
    if (whereClause) {
      const whereRes = await this._applyWhereConditions(q, whereClause, params, tableAlias, tableName, sql);
      q = whereRes.builder;
    }

    // Parse ORDER BY
    let postSort = null;
    if (orderExpr) {
      const parts = orderExpr.split(',')[0].trim().split(/\s+/);
      let rawCol = parts[0];
      let orderAlias = rawCol.includes('.') ? rawCol.split('.')[0].toLowerCase() : null;
      let orderCol = rawCol.includes('.') ? rawCol.split('.')[1] : rawCol;
      orderCol = orderCol.replace(/["'`]/g, '');
      const isAsc = !parts[1] || parts[1].toUpperCase() === 'ASC';

      if (orderAlias && tableAlias && orderAlias !== tableAlias.toLowerCase()) {
        postSort = { col: orderCol, isAsc };
      } else if (/^[a-zA-Z0-9_]+$/.test(orderCol)) {
        q = q.order(orderCol, { ascending: isAsc });
      }
    }

    // Parse LIMIT
    if (limitVal) {
      let resolvedLimit = limitVal;
      if (resolvedLimit.startsWith('$')) {
        resolvedLimit = this._resolveParam(resolvedLimit.slice(1), params);
      }
      const num = parseInt(resolvedLimit, 10);
      if (!isNaN(num) && num > 0) {
        q = q.limit(num);
      }
    }

    const { data, error } = await q;
    if (error) throw error;

    let rows = data || [];

    // Check if query was a pure top-level COUNT query
    if (/^SELECT\s+COUNT\s*\(/i.test(sql.trim())) {
      const count = rows.length;
      return { rows: [{ count, count: count }], rowCount: 1 };
    }

    // Resolve JOIN clauses if present
    if (rows.length > 0 && /JOIN\s+[a-zA-Z0-9_]+/i.test(sql)) {
      rows = await this._resolveJoins(sql, tableName, tableAlias, rows);
    }

    if (postSort && rows.length > 1) {
      rows.sort((a, b) => {
        const valA = a[postSort.col] ?? '';
        const valB = b[postSort.col] ?? '';
        if (valA < valB) return postSort.isAsc ? -1 : 1;
        if (valA > valB) return postSort.isAsc ? 1 : -1;
        return 0;
      });
    }

    return { rows, rowCount: rows.length };
  }

  /**
   * Resolves SQL JOIN operations by querying related tables via Supabase
   * and projecting/enriching the resulting rows.
   */
  async _resolveJoins(sql, primaryTable, primaryAlias, rows) {
    if (!rows || rows.length === 0) return rows;

    const joinRegex = /(?:LEFT\s+|INNER\s+|RIGHT\s+)?JOIN\s+([a-zA-Z0-9_]+)(?:\s+(?:AS\s+)?([a-zA-Z0-9_]+))?\s+ON\s+([^\n\r;]+?)(?=\s+(?:LEFT|INNER|RIGHT|JOIN|WHERE|GROUP|ORDER|LIMIT|$))/gi;

    const joins = [];
    let match;
    while ((match = joinRegex.exec(sql)) !== null) {
      const table = match[1].toLowerCase();
      const alias = match[2] ? match[2].toLowerCase() : table;
      const cond = match[3].trim();
      const isInner = /^INNER\s+JOIN/i.test(match[0].trim()) || (!match[0].toLowerCase().includes('left') && !match[0].toLowerCase().includes('right'));
      joins.push({ table, alias, cond, isInner });
    }

    if (joins.length === 0) return rows;

    // Parse SELECT aliases: e.g. "r.code AS role_code", "s.id as student_id"
    const selectMatch = sql.match(/SELECT\s+([\s\S]+?)\s+FROM/i);
    const selectAliases = [];
    if (selectMatch) {
      const rawCols = selectMatch[1].split(',');
      for (const c of rawCols) {
        const colAliasMatch = c.trim().match(/(?:([a-zA-Z0-9_]+)\.)?([a-zA-Z0-9_]+)\s+AS\s+([a-zA-Z0-9_]+)/i);
        if (colAliasMatch) {
          selectAliases.push({
            tableAlias: colAliasMatch[1] ? colAliasMatch[1].toLowerCase() : null,
            col: colAliasMatch[2].toLowerCase(),
            alias: colAliasMatch[3]
          });
        }
      }
    }

    for (const j of joins) {
      // Find equality condition: alias.col = other.col or vice-versa
      const eqMatches = j.cond.match(/(?:([a-zA-Z0-9_]+)\.)?([a-zA-Z0-9_]+)\s*=\s*(?:([a-zA-Z0-9_]+)\.)?([a-zA-Z0-9_]+)/i);
      if (!eqMatches) continue;

      let targetKey, sourceAlias, sourceKey;
      const t1Alias = (eqMatches[1] || '').toLowerCase();
      const t1Col = eqMatches[2].toLowerCase();
      const t2Alias = (eqMatches[3] || '').toLowerCase();
      const t2Col = eqMatches[4].toLowerCase();

      if (t1Alias === j.alias) {
        targetKey = t1Col;
        sourceAlias = t2Alias;
        sourceKey = t2Col;
      } else if (t2Alias === j.alias) {
        targetKey = t2Col;
        sourceAlias = t1Alias;
        sourceKey = t1Col;
      } else {
        // Fallback heuristic: match targetKey by checking which side matches joined table or typical primary key
        targetKey = t1Col === 'id' ? t1Col : t2Col;
        sourceKey = targetKey === t1Col ? t2Col : t1Col;
      }

      // Collect source keys from existing rows
      const sourceValues = new Set();
      for (const r of rows) {
        let val = r[sourceKey];
        if (val === undefined && sourceAlias) {
          val = r[`${sourceAlias}.${sourceKey}`];
        }
        if (val !== undefined && val !== null) {
          sourceValues.add(val);
        }
      }

      const keyArray = Array.from(sourceValues);
      if (keyArray.length === 0) continue;

      try {
        const { data: joinedData, error } = await this.client
          .from(j.table)
          .select('*')
          .in(targetKey, keyArray);

        if (error || !joinedData) {
          continue;
        }

        // Apply extra literal filters from the ON condition if present
        let filteredJoinedData = joinedData;
        const statusMatch = j.cond.match(/LOWER\(\s*(?:[a-zA-Z0-9_]+\.)?status\s*\)\s*=\s*'([^']+)'/i);
        if (statusMatch) {
          const expectedStatus = statusMatch[1].toLowerCase();
          filteredJoinedData = filteredJoinedData.filter(d => (d.status || '').toLowerCase() === expectedStatus);
        }

        // Map joined rows by targetKey
        const joinedMap = new Map();
        for (const jd of filteredJoinedData) {
          const k = String(jd[targetKey]);
          if (!joinedMap.has(k)) {
            joinedMap.set(k, []);
          }
          joinedMap.get(k).push(jd);
        }

        // Enrich rows
        for (const r of rows) {
          let srcVal = r[sourceKey];
          if (srcVal === undefined && sourceAlias) {
            srcVal = r[`${sourceAlias}.${sourceKey}`];
          }
          const matches = joinedMap.get(String(srcVal));
          if (matches && matches.length > 0) {
            const first = matches[0];
            // Standard columns
            for (const [colName, colVal] of Object.entries(first)) {
              if (r[colName] === undefined) {
                r[colName] = colVal;
              }
              r[`${j.alias}.${colName}`] = colVal;
            }

            // Explicit SELECT aliases
            for (const sa of selectAliases) {
              if ((!sa.tableAlias || sa.tableAlias === j.alias) && first[sa.col] !== undefined) {
                r[sa.alias] = first[sa.col];
              }
            }
          }
        }
      } catch (err) {
        console.warn(`[SupabaseQueryAdapter] Join error on ${j.table}:`, err.message);
      }
    }

    return rows;
  }

  /**
   * Applies parsed WHERE conditions to a Supabase query builder
   */
  async _applyWhereConditions(query, whereStr, params, tableAlias, tableName, sql) {
    let q = query;

    // Split on top-level ANDs
    const conditions = whereStr.split(/\s+AND\s+/i);

    for (const cond of conditions) {
      const trimmed = cond.trim();

      // Check parenthesized OR condition: (col1 = $1 OR col2 = $2 ...)
      const orMatch = trimmed.match(/^\(([\s\S]+?)\)$/);
      if (orMatch && /\s+OR\s+/i.test(orMatch[1])) {
        const orClauses = orMatch[1].split(/\s+OR\s+/i);
        const postgrestOrParts = [];
        for (const sub of orClauses) {
          const subEq = sub.trim().match(/(?:([a-zA-Z0-9_]+)\.)?([a-zA-Z0-9_]+)(?:::text)?\s*=\s*\$(\d+)/i);
          if (subEq) {
            const col = subEq[2].toLowerCase();
            let val = this._resolveParam(subEq[3], params);
            if (val !== null && val !== undefined) {
              val = this._normalizeUuidParam(col, val);
              if (val !== '__SKIP_INVALID_UUID__') {
                postgrestOrParts.push(`${col}.eq.${val}`);
              }
            }
          }
        }
        if (postgrestOrParts.length > 0) {
          q = q.or(postgrestOrParts.join(','));
          continue;
        }
      }

      // Check comparison operators: col >= $n, col <= $n, col > $n, col < $n, col != $n
      const compMatch = trimmed.match(/(?:([a-zA-Z0-9_]+)\.)?([a-zA-Z0-9_]+)\s*(>=|<=|>|<|!=|<>)\s*\$(\d+)/i);
      if (compMatch) {
        const condAlias = compMatch[1] ? compMatch[1].toLowerCase() : null;
        const col = compMatch[2].toLowerCase();
        const op = compMatch[3];
        const val = this._resolveParam(compMatch[4], params);
        if (condAlias && tableAlias && condAlias !== tableAlias.toLowerCase()) continue;
        if (val !== null && val !== undefined) {
          if (op === '>=') q = q.gte(col, val);
          else if (op === '<=') q = q.lte(col, val);
          else if (op === '>') q = q.gt(col, val);
          else if (op === '<') q = q.lt(col, val);
          else if (op === '!=' || op === '<>') q = q.neq(col, val);
          continue;
        }
      }

      // Check col = $n or col::text = $n or table.col = $n
      const eqMatch = trimmed.match(/(?:([a-zA-Z0-9_]+)\.)?([a-zA-Z0-9_]+)(?:::text)?\s*=\s*\$(\d+)/i);
      if (eqMatch) {
        const condAlias = eqMatch[1] ? eqMatch[1].toLowerCase() : null;
        const col = eqMatch[2].toLowerCase();
        let val = this._resolveParam(eqMatch[3], params);

        if (condAlias && tableAlias && condAlias !== tableAlias.toLowerCase()) {
          const sub = await this._subfilterJoinedTable(q, sql, condAlias, col, val);
          if (sub) q = sub;
          continue;
        }

        if (val !== null && val !== undefined) {
          val = this._normalizeUuidParam(col, val);
          if (val === '__SKIP_INVALID_UUID__') continue;
          q = q.eq(col, val);
          continue;
        }
      }

      // Check LOWER(col) = LOWER($n)
      const lowerMatch = trimmed.match(/LOWER\(\s*(?:([a-zA-Z0-9_]+)\.)?([a-zA-Z0-9_]+)\s*\)\s*=\s*LOWER\(\s*\$(\d+)\s*\)/i);
      if (lowerMatch) {
        const condAlias = lowerMatch[1] ? lowerMatch[1].toLowerCase() : null;
        const col = lowerMatch[2].toLowerCase();
        const val = this._resolveParam(lowerMatch[3], params);

        if (condAlias && tableAlias && condAlias !== tableAlias.toLowerCase()) {
          continue;
        }

        if (val !== null && val !== undefined) {
          q = q.ilike(col, String(val).trim());
          continue;
        }
      }

      // Check col ILIKE $n or col LIKE $n
      const likeMatch = trimmed.match(/(?:([a-zA-Z0-9_]+)\.)?([a-zA-Z0-9_]+)\s+(?:I?LIKE)\s*\$(\d+)/i);
      if (likeMatch) {
        const condAlias = likeMatch[1] ? likeMatch[1].toLowerCase() : null;
        const col = likeMatch[2].toLowerCase();
        const val = this._resolveParam(likeMatch[3], params);

        if (condAlias && tableAlias && condAlias !== tableAlias.toLowerCase()) {
          continue;
        }

        if (val !== null && val !== undefined) {
          q = q.ilike(col, val);
          continue;
        }
      }

      // Check col IN ($n) or col = ANY($n)
      const inMatch = trimmed.match(/(?:([a-zA-Z0-9_]+)\.)?([a-zA-Z0-9_]+)\s+IN\s*\(\s*\$(\d+)\s*\)/i);
      if (inMatch) {
        const condAlias = inMatch[1] ? inMatch[1].toLowerCase() : null;
        const col = inMatch[2].toLowerCase();
        const val = this._resolveParam(inMatch[3], params);

        if (condAlias && tableAlias && condAlias !== tableAlias.toLowerCase()) {
          continue;
        }

        if (Array.isArray(val)) {
          q = q.in(col, val);
          continue;
        } else if (val) {
          q = q.eq(col, val);
          continue;
        }
      }

      // Check col IS NULL
      const isNullMatch = trimmed.match(/(?:([a-zA-Z0-9_]+)\.)?([a-zA-Z0-9_]+)\s+IS\s+NULL/i);
      if (isNullMatch) {
        const condAlias = isNullMatch[1] ? isNullMatch[1].toLowerCase() : null;
        if (condAlias && tableAlias && condAlias !== tableAlias.toLowerCase()) continue;
        q = q.is(isNullMatch[2].toLowerCase(), null);
        continue;
      }

      // Check col IS NOT NULL
      const notNullMatch = trimmed.match(/(?:([a-zA-Z0-9_]+)\.)?([a-zA-Z0-9_]+)\s+IS\s+NOT\s+NULL/i);
      if (notNullMatch) {
        const condAlias = notNullMatch[1] ? notNullMatch[1].toLowerCase() : null;
        if (condAlias && tableAlias && condAlias !== tableAlias.toLowerCase()) continue;
        q = q.not(notNullMatch[2].toLowerCase(), 'is', null);
        continue;
      }

      // Check boolean flags: col = true / col = false
      const boolMatch = trimmed.match(/(?:([a-zA-Z0-9_]+)\.)?([a-zA-Z0-9_]+)\s*=\s*(true|false)/i);
      if (boolMatch) {
        const condAlias = boolMatch[1] ? boolMatch[1].toLowerCase() : null;
        if (condAlias && tableAlias && condAlias !== tableAlias.toLowerCase()) continue;
        q = q.eq(boolMatch[2].toLowerCase(), boolMatch[3].toLowerCase() === 'true');
        continue;
      }

      // Check string literal equality: col = 'VALUE'
      const strLiteralMatch = trimmed.match(/(?:([a-zA-Z0-9_]+)\.)?([a-zA-Z0-9_]+)\s*=\s*'([^']+)'/i);
      if (strLiteralMatch) {
        const condAlias = strLiteralMatch[1] ? strLiteralMatch[1].toLowerCase() : null;
        if (condAlias && tableAlias && condAlias !== tableAlias.toLowerCase()) continue;
        q = q.eq(strLiteralMatch[2].toLowerCase(), strLiteralMatch[3]);
        continue;
      }
    }

    return { builder: q };
  }

  /**
   * Filters the root query by resolving foreign keys from a joined table condition
   */
  async _subfilterJoinedTable(q, sql, joinedAlias, col, val) {
    if (!sql || !joinedAlias) return null;
    const joinRegex = new RegExp(`(?:LEFT\\s+|INNER\\s+|RIGHT\\s+)?JOIN\\s+([a-zA-Z0-9_]+)(?:\\s+(?:AS\\s+)?${joinedAlias})?\\s+ON\\s+([^\\n\\r;]+?)(?=\\s+(?:LEFT|INNER|RIGHT|JOIN|WHERE|GROUP|ORDER|LIMIT|$))`, 'i');
    const m = sql.match(joinRegex);
    if (!m) return null;

    const joinedTable = m[1].toLowerCase();
    const cond = m[2].trim();

    const eq = cond.match(/(?:([a-zA-Z0-9_]+)\.)?([a-zA-Z0-9_]+)\s*=\s*(?:([a-zA-Z0-9_]+)\.)?([a-zA-Z0-9_]+)/i);
    if (!eq) return null;

    let targetKey, rootKey;
    if ((eq[1] || '').toLowerCase() === joinedAlias.toLowerCase()) {
      targetKey = eq[2].toLowerCase();
      rootKey = eq[4].toLowerCase();
    } else if ((eq[3] || '').toLowerCase() === joinedAlias.toLowerCase()) {
      targetKey = eq[4].toLowerCase();
      rootKey = eq[2].toLowerCase();
    } else {
      return null;
    }

    try {
      let qSub = this.client.from(joinedTable).select(targetKey);
      if (val !== undefined && val !== null) {
        val = this._normalizeUuidParam(col, val);
        if (val === '__SKIP_INVALID_UUID__') {
          return null;
        }
        qSub = qSub.eq(col, val);
      }
      const { data: matches } = await qSub;
      const keys = (matches || []).map(r => r[targetKey]).filter(Boolean);
      if (keys.length > 0) {
        return q.in(rootKey, keys);
      } else {
        return (q && typeof q.eq === 'function') ? q.eq(rootKey, '00000000-0000-0000-0000-000000000000') : null;
      }
    } catch {
      return null;
    }
  }

  /**
   * Handles INSERT queries
   */
  async _handleInsert(sql, params) {
    const tableMatch = sql.match(/INTO\s+([a-zA-Z0-9_]+)/i);
    if (!tableMatch) return { rows: [], rowCount: 0 };
    const tableName = tableMatch[1].toLowerCase();

    // Extract columns
    const colsMatch = sql.match(/\(([^)]+)\)\s*VALUES/i);
    if (!colsMatch) return { rows: [], rowCount: 0 };

    const colNames = colsMatch[1].split(',').map(c => c.trim().replace(/["'`]/g, ''));

    // Extract values placeholder
    const valsMatch = sql.match(/VALUES\s*\(([^)]+)\)/i);
    if (!valsMatch) return { rows: [], rowCount: 0 };

    const valPlaceholders = valsMatch[1].split(',').map(v => v.trim());

    const record = {};
    for (let i = 0; i < colNames.length; i++) {
      const col = colNames[i];
      const ph = valPlaceholders[i];

      if (!ph) continue;

      if (ph.startsWith('$')) {
        const val = this._resolveParam(ph.slice(1), params);
        record[col] = val;
      } else if (ph.toUpperCase() === 'NOW()' || ph.toUpperCase() === 'CURRENT_TIMESTAMP') {
        record[col] = new Date().toISOString();
      } else if (ph.toLowerCase().includes('gen_random_uuid()')) {
        record[col] = require('crypto').randomUUID();
      } else if (ph.toUpperCase() === 'TRUE') {
        record[col] = true;
      } else if (ph.toUpperCase() === 'FALSE') {
        record[col] = false;
      } else if (ph.toUpperCase() === 'NULL') {
        record[col] = null;
      } else if (/^'([^']*)'$/.test(ph)) {
        record[col] = ph.slice(1, -1);
      } else if (!isNaN(Number(ph))) {
        record[col] = Number(ph);
      }
    }

    // Check for ON CONFLICT
    let q;
    if (/ON\s+CONFLICT/i.test(sql)) {
      if (/DO\s+NOTHING/i.test(sql)) {
        q = this.client.from(tableName).insert(record).select();
      } else {
        q = this.client.from(tableName).upsert(record).select();
      }
    } else {
      q = this.client.from(tableName).insert(record).select();
    }

    const { data, error } = await q;
    if (error) throw error;

    return { rows: data || [], rowCount: data ? data.length : 0 };
  }

  /**
   * Handles UPDATE queries
   */
  async _handleUpdate(sql, params) {
    const tableMatch = sql.match(/UPDATE\s+([a-zA-Z0-9_]+)/i);
    if (!tableMatch) return { rows: [], rowCount: 0 };
    const tableName = tableMatch[1].toLowerCase();

    // Extract SET clause
    const setMatch = sql.match(/SET\s+([\s\S]+?)(?:\s+WHERE|$)/i);
    if (!setMatch) return { rows: [], rowCount: 0 };

    const setParts = setMatch[1].split(',');
    const updates = {};

    for (const part of setParts) {
      const assign = part.trim().match(/([a-zA-Z0-9_]+)\s*=\s*(.+)/);
      if (!assign) continue;

      const col = assign[1].trim();
      const rhs = assign[2].trim();

      // Handle COALESCE($1, col) pattern
      const coalesceMatch = rhs.match(/COALESCE\s*\(\s*\$(\d+)\s*,\s*[a-zA-Z0-9_.]+\s*\)/i);
      if (coalesceMatch) {
        const val = this._resolveParam(coalesceMatch[1], params);
        if (val !== null && val !== undefined) {
          updates[col] = val;
        }
        continue;
      }

      if (rhs.startsWith('$')) {
        const val = this._resolveParam(rhs.slice(1), params);
        updates[col] = val;
      } else if (rhs.toUpperCase() === 'NOW()' || rhs.toUpperCase() === 'CURRENT_TIMESTAMP') {
        updates[col] = new Date().toISOString();
      } else if (rhs.toUpperCase() === 'TRUE') {
        updates[col] = true;
      } else if (rhs.toUpperCase() === 'FALSE') {
        updates[col] = false;
      } else if (rhs.toUpperCase() === 'NULL') {
        updates[col] = null;
      } else if (/^'([^']*)'$/.test(rhs)) {
        updates[col] = rhs.slice(1, -1);
      }
    }

    let q = this.client.from(tableName).update(updates);

    // Parse WHERE clause
    const whereMatch = sql.match(/WHERE\s+([\s\S]+?)(?:\s+RETURNING|$)/i);
    if (whereMatch) {
      const whereRes = await this._applyWhereConditions(q, whereMatch[1], params, null, tableName, sql);
      q = whereRes.builder;
    }

    q = q.select();

    const { data, error } = await q;
    if (error) throw error;

    return { rows: data || [], rowCount: data ? data.length : 0 };
  }

  /**
   * Handles DELETE queries
   */
  async _handleDelete(sql, params) {
    const tableMatch = sql.match(/FROM\s+([a-zA-Z0-9_]+)/i);
    if (!tableMatch) return { rows: [], rowCount: 0 };
    const tableName = tableMatch[1].toLowerCase();

    let q = this.client.from(tableName).delete();

    const whereMatch = sql.match(/WHERE\s+([\s\S]+?)(?:\s+RETURNING|$)/i);
    if (whereMatch) {
      const whereRes = await this._applyWhereConditions(q, whereMatch[1], params, null, tableName, sql);
      q = whereRes.builder;
    }

    q = q.select();

    const { data, error } = await q;
    if (error) throw error;

    return { rows: data || [], rowCount: data ? data.length : 0 };
  }
}

module.exports = {
  SupabaseQueryAdapter,
  supabaseQueryAdapter: new SupabaseQueryAdapter(supabase)
};
