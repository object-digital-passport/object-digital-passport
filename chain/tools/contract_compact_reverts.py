#!/usr/bin/env python3
"""Replace require(cond, \"msg\") with if (!(cond)) revert EC(n); to shrink bytecode."""
from __future__ import annotations

import pathlib
import sys


def find_requires(s: str) -> list[tuple[int, int, str, str]]:
    out: list[tuple[int, int, str, str]] = []
    i = 0
    while True:
        j = s.find("require(", i)
        if j == -1:
            break
        start = j + len("require(")
        depth = 1
        k = start
        while k < len(s) and depth > 0:
            if s[k] == "(":
                depth += 1
            elif s[k] == ")":
                depth -= 1
            k += 1
        inner = s[start : k - 1]
        last_comma = inner.rfind(",")
        if last_comma == -1:
            i = k
            continue
        cond = inner[:last_comma].strip()
        msg_part = inner[last_comma + 1 :].strip()
        if not (len(msg_part) >= 2 and msg_part[0] == '"' and msg_part[-1] == '"'):
            i = k
            continue
        msg = msg_part[1:-1]
        out.append((j, k, cond, msg))
        i = k
    return out


def find_reverts(s: str) -> list[tuple[int, int, str]]:
    out: list[tuple[int, int, str]] = []
    i = 0
    while True:
        j = s.find('revert("', i)
        if j == -1:
            break
        start = j + len('revert("')
        end = s.find('")', start)
        if end == -1:
            break
        msg = s[start:end]
        out.append((j, end + 2, msg))
        i = end + 2
    return out


def main() -> int:
    root = pathlib.Path(__file__).resolve().parents[1]
    path = root / "contracts" / "ObjectDigitalPassport.sol"
    content = path.read_text(encoding="utf-8")
    if "error EC(uint16 code)" not in content:
        content = content.replace(
            "contract ObjectDigitalPassport {\n\n    // ─── Constants",
            "contract ObjectDigitalPassport {\n\n    error EC(uint16 code);\n\n    // ─── Constants",
            1,
        )

    msg_to_code: dict[str, int] = {}
    next_code = 1

    def code_for(msg: str) -> int:
        nonlocal next_code
        if msg not in msg_to_code:
            msg_to_code[msg] = next_code
            next_code += 1
        return msg_to_code[msg]

    matches = find_requires(content)
    matches.sort(key=lambda x: -x[0])
    newc = content
    for j, k, cond, msg in matches:
        c = code_for(msg)
        replacement = f"if (!({cond})) revert EC({c});"
        newc = newc[:j] + replacement + newc[k:]

    revs = find_reverts(newc)
    revs.sort(key=lambda x: -x[0])
    for j, k, msg in revs:
        c = code_for(msg)
        replacement = f"revert EC({c});"
        newc = newc[:j] + replacement + newc[k:]

    path.write_text(newc, encoding="utf-8")
    print(f"Wrote {path}; {len(msg_to_code)} unique revert codes")
    return 0


if __name__ == "__main__":
    sys.exit(main())
