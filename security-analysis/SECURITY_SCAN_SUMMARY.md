# Security Scan Summary

Generated reports in this directory:

| Tool | Report | Scope |
|------|--------|-------|
| flawfinder | `flawfinder-first-party-clean.txt` | first-party C/C++ paths, excluding vendored/generated/node_modules paths |
| flawfinder | `flawfinder-first-party.txt` / `.html` | broader first-party command, includes some third-party subtrees |
| cppcheck | `cppcheck-first-party-clean.txt` | first-party C/C++ paths, excluding vendored/generated paths |
| cppcheck | `cppcheck-first-party.txt` | broader first-party command, includes some generated/third-party paths |
| bandit | `bandit-python.txt` | Python webapp, Python client, e2e test |
| shellcheck | `shellcheck.txt` | repository shell scripts excluding checked-out submodule trees |

## Tool Versions

- flawfinder 2.0.19
- cppcheck 2.13.0
- clang-tidy 18.1.3 installed, not run in this pass
- bandit 1.6.2
- shellcheck installed

## Headline Results

### flawfinder clean first-party report

Original report from `flawfinder-first-party-clean.txt`:

```text
Hits = 66
Hits@level = [0] 39 [1] 2 [2] 63 [3] 1 [4] 0 [5] 0
Hits@level+ = [0+] 105 [1+] 66 [2+] 64 [3+] 1 [4+] 0 [5+] 0
```

After fixes, `flawfinder-after-fixes.txt` reports:

```text
Hits = 6
Hits = [0] 39 [1] 5 [2] 1 [3] 0 [4] 0 [5] 0
Hits+ = [0+] 45 [1+] 6 [2+] 1 [3+] 0 [4+] 0 [5+] 0
```

The previous level-3 hit has been eliminated. The remaining level-2 hit is `mkstemp` in a unit test; the remaining level-1 hits are checked fixed-size OS entropy reads.

### cppcheck clean first-party report

`cppcheck-first-party-clean.txt` is clean for the enabled warning, performance, and portability checks after suppressing constructor-initializer-list style noise. No cppcheck `error` records are reported.

### Bandit

`bandit-python.txt` is clean. Intentional local subprocess launches are annotated with targeted `# nosec` comments, and previous broad exception swallowing in `webapp/cluster.py` now logs debug messages. Bandit reports no low, medium, or high severity issues.

### ShellCheck

`shellcheck.txt` is clean. The previous script hygiene findings were fixed in the demo and YYH26 setup scripts

## Notes

The actionable flawfinder findings from the fix-recommended and review-before-fixing groups were remediated. Main CMake build, XZH26 experiment build, and targeted protocol/gRPC tests passed after the changes.

`clang-tidy` is installed but was not run yet. A useful next pass would use `build/compile_commands.json` and run clang-tidy only on first-party service files to avoid vendored noise.
