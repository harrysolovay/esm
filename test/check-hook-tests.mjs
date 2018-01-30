import assert from "assert"
import execa from "execa"
import path from "path"

const testPath = path.resolve(".")

function shell(command) {
  return execa.shell(command, {
    cwd: testPath,
    reject: false
  })
}

describe("--check hook", function () {
  this.timeout(0)

  it("should support Node -c and --check", () => {
    const checkFlags = ["-c", "--check"]
    const requireFlags = ["-r", "--require"]
    const runs = []

    requireFlags.forEach((requireFlag) => {
      checkFlags.forEach((checkFlag) => {
        runs.push([
          "echo",
          "'" +
          [
            'import console from "console"',
            'console.log("check-hook:true")'
          ].join(";") +
          "'",
          "|",
          process.execPath,
          checkFlag,
          requireFlag, "../"
        ].join(" "))
      })
    })

    return runs
      .reduce((promise, command) =>
        promise
          .then(() => shell(command))
          .then((result) => {
            assert.strictEqual(result.stderr, "")
            assert.strictEqual(result.stdout, "")
          })
      , Promise.resolve())
  })
})
