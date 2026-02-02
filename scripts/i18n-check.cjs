#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const LOCALES = ['en', 'lv', 'ru', 'en-ps'];
const SOURCE_LOCALE = 'en';
const LOCALES_DIR = path.join(process.cwd(), 'client', 'public', 'locales');

const readJson = (filePath) => {
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw);
};

const flatten = (obj, prefix = '') => {
  let entries = [];
  if (Array.isArray(obj)) {
    obj.forEach((value, index) => {
      const next = `${prefix}[${index}]`;
      entries = entries.concat(flatten(value, next));
    });
    return entries;
  }
  if (obj && typeof obj === 'object') {
    Object.keys(obj).forEach((key) => {
      const next = prefix ? `${prefix}.${key}` : key;
      entries = entries.concat(flatten(obj[key], next));
    });
    return entries;
  }
  entries.push({ key: prefix, value: obj });
  return entries;
};

const extractPlaceholders = (value) => {
  if (typeof value !== 'string') return [];
  const matches = value.match(/{{\s*([\w.-]+)\s*}}/g);
  if (!matches) return [];
  return matches.map((match) => match.replace(/[{}\s]/g, ''));
};

const sourcePath = path.join(LOCALES_DIR, SOURCE_LOCALE, 'translation.json');
if (!fs.existsSync(sourcePath)) {
  console.error(`Missing source locale at ${sourcePath}`);
  process.exit(1);
}

const sourceData = readJson(sourcePath);
const sourceEntries = flatten(sourceData);
const sourceKeys = new Set(sourceEntries.map((entry) => entry.key));
const sourceMap = new Map(sourceEntries.map((entry) => [entry.key, entry.value]));

let hasErrors = false;

LOCALES.forEach((locale) => {
  const localePath = path.join(LOCALES_DIR, locale, 'translation.json');
  if (!fs.existsSync(localePath)) {
    console.error(`[${locale}] Missing translation file at ${localePath}`);
    hasErrors = true;
    return;
  }

  const localeEntries = flatten(readJson(localePath));
  const localeKeys = new Set(localeEntries.map((entry) => entry.key));

  const missing = [...sourceKeys].filter((key) => !localeKeys.has(key));
  const extra = [...localeKeys].filter((key) => !sourceKeys.has(key));

  if (missing.length || extra.length) {
    hasErrors = true;
    console.error(`[${locale}] Key mismatch: missing=${missing.length} extra=${extra.length}`);
    if (missing.length) {
      console.error(`  Missing keys (${Math.min(missing.length, 20)} shown):`);
      missing.slice(0, 20).forEach((key) => console.error(`    - ${key}`));
    }
    if (extra.length) {
      console.error(`  Extra keys (${Math.min(extra.length, 20)} shown):`);
      extra.slice(0, 20).forEach((key) => console.error(`    - ${key}`));
    }
  }

  const placeholderIssues = [];
  localeEntries.forEach(({ key, value }) => {
    if (!sourceMap.has(key)) return;
    const sourcePlaceholders = extractPlaceholders(sourceMap.get(key));
    const localePlaceholders = extractPlaceholders(value);
    const sourceSet = new Set(sourcePlaceholders);
    const localeSet = new Set(localePlaceholders);
    const missingPlaceholders = sourcePlaceholders.filter((p) => !localeSet.has(p));
    const extraPlaceholders = localePlaceholders.filter((p) => !sourceSet.has(p));
    if (missingPlaceholders.length || extraPlaceholders.length) {
      placeholderIssues.push({
        key,
        missingPlaceholders,
        extraPlaceholders,
      });
    }
  });

  if (placeholderIssues.length) {
    hasErrors = true;
    console.error(`[${locale}] Placeholder mismatch (${placeholderIssues.length} keys):`);
    placeholderIssues.slice(0, 20).forEach((issue) => {
      const missing = issue.missingPlaceholders.length
        ? ` missing: ${issue.missingPlaceholders.join(', ')}`
        : '';
      const extra = issue.extraPlaceholders.length
        ? ` extra: ${issue.extraPlaceholders.join(', ')}`
        : '';
      console.error(`  - ${issue.key}${missing}${extra}`);
    });
  }
});

if (hasErrors) {
  process.exit(1);
}

console.log('i18n check passed: all locales match source keys and placeholders.');
