import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import ts from 'typescript'

const file = path.resolve('src/i18n.ts')
const sourceText = fs.readFileSync(file, 'utf8')
const source = ts.createSourceFile(file, sourceText, ts.ScriptTarget.Latest, true)

function readDictionary(name) {
  let object
  source.forEachChild((node) => {
    if (!ts.isVariableStatement(node)) return
    for (const declaration of node.declarationList.declarations) {
      if (ts.isIdentifier(declaration.name) && declaration.name.text === name) {
        object = declaration.initializer
      }
    }
  })
  if (!object || !ts.isObjectLiteralExpression(object)) {
    throw new Error(`Could not find the ${name} dictionary`)
  }

  const messages = new Map()
  for (const property of object.properties) {
    if (!ts.isPropertyAssignment(property) || !ts.isStringLiteral(property.name)) continue
    if (!ts.isStringLiteralLike(property.initializer)) {
      throw new Error(`${name}.${property.name.text} must be a plain string literal`)
    }
    const key = property.name.text
    if (messages.has(key)) throw new Error(`Duplicate key in ${name}: ${key}`)
    messages.set(key, property.initializer.text)
  }
  return messages
}

function placeholders(value) {
  return [...value.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort()
}

const en = readDictionary('en')
const zh = readDictionary('zh')
const errors = []

for (const key of en.keys()) {
  if (!zh.has(key)) errors.push(`Missing Chinese key: ${key}`)
}
for (const key of zh.keys()) {
  if (!en.has(key)) errors.push(`Missing English key: ${key}`)
}
for (const [key, english] of en) {
  if (!zh.has(key)) continue
  const enVars = placeholders(english).join(',')
  const zhVars = placeholders(zh.get(key)).join(',')
  if (enVars !== zhVars) {
    errors.push(`Placeholder mismatch for ${key}: en={${enVars}} zh={${zhVars}}`)
  }
}

if (errors.length) {
  for (const error of errors) console.error(error)
  process.exit(1)
}

console.log(`i18n check passed: ${en.size} English and ${zh.size} Chinese messages`)
