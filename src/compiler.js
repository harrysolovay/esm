import AV from "./assignment-visitor.js"
import FastPath from "./fast-path.js"
import { get as getOption } from "./options.js"
import IEV from "./import-export-visitor.js"
import Parser from "./parser.js"

const assignmentVisitor = new AV
const importExportVisitor = new IEV
const codeOfPound = "#".charCodeAt(0)
const shebangRegExp = /^#!.*/

// Matches any import or export identifier as long as it's not preceded by a "."
// character (e.g. runtime.export) to prevent the compiler from compiling code
// it has already compiled.
const importExportRegExp = /(?:^|[^.])\b(?:im|ex)port\b/

class Compiler {
  static compile(code, options) {
    options = Object.assign(Object.create(null), options)

    if (code.charCodeAt(0) === codeOfPound) {
      code = code.replace(shebangRegExp, "")
    }

    const result = {
      code,
      data: null,
      sourceType: "script"
    }

    const sourceType = getOption(options, "sourceType")

    if (sourceType === "script" ||
        (sourceType === "unambiguous" && ! importExportRegExp.test(code))) {
      return result
    }

    const rootPath = new FastPath(Parser.parse(code, {
      allowReturnOutsideFunction: getOption(options, "allowReturnOutsideFunction"),
      enableExportExtensions: getOption(options, "enableExportExtensions"),
      enableImportExtensions: getOption(options, "enableImportExtensions")
    }))

    importExportVisitor.visit(rootPath, code, options)

    if (importExportVisitor.madeChanges) {
      assignmentVisitor.visit(rootPath, {
        exportedLocalNames: importExportVisitor.exportedLocalNames,
        magicString: importExportVisitor.magicString,
        runtimeAlias: importExportVisitor.runtimeAlias
      })

      importExportVisitor.finalizeHoisting()
    }

    if (importExportVisitor.madeChanges || sourceType !== "unambiguous") {
      result.sourceType = "module"
    }

    result.code = importExportVisitor.magicString.toString()
    return result
  }
}

Object.setPrototypeOf(Compiler.prototype, null)

export default Compiler
