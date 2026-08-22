# Activation sponsorship is an on-chain paymaster, not a server

Activation is free to the holder only because somebody else pays the fee. SPEC §20.9 now requires that the sponsorship *rule* be a contract rather than a server policy: an issuer covering activation fees SHOULD do so through an **ERC-4337 paymaster** funded by an on-chain deposit, with transport over the public bundler network rather than an issuer-run endpoint. Issuer endpoints remain permitted but must never be presented as the only route.

The same section also now requires a duplicate activation to **revert with a distinct error code**, with the existing record read through a `view` call.

## Why

A blockchain cannot broadcast its own transactions — something off-chain must sign and send, and no arrangement changes that. What is genuinely choosable is where the rules live and who may carry the message. A server-side sponsorship policy is invisible from outside: it can quietly refuse one holder, favour some units over others, or disappear, and an observer cannot tell which happened. A paymaster's policy is public bytecode with a public balance, and the public bundler network means the issuer funds the deposit without ever standing between a holder and the chain. When the deposit empties, holders self-publish and nothing breaks.

The revert rule closes a drain. Under the previous text a duplicate submission succeeded as a no-op, so anyone holding a single genuine code could replay one valid signature indefinitely: the record would never change and the fee would be charged every time, emptying whoever was paying. Reverting makes the duplicate fail during simulation, so a sponsor rejects it before any money moves — including a sponsor written naively, which is the point.

## Consequences

- "Relayer" and "sponsor" are now distinct roles: the courier that carries a signature, and the on-chain contract that pays. Neither gains any right over a unit.
- Reading an activation record is a `view` call, never a side effect of attempting a write.
- Free activation remains contingent, and the specification says so: it depends on a funded deposit, not on a protocol guarantee. The self-publish path is what makes the contingency safe.
