# GitHub Support request: purge cached views and PR refs that reach a leaked-credentials commit

DRAFT, not sent

## Before you send

- [ ] Rotate BOTH values from `.claude/launch.json` (the bootstrap token and the document encryption key), then tick this box.
- [ ] Confirm that no real user data was ever encrypted or accessed with these values. If you cannot confirm this, reword the severity paragraph in the body before sending.
- [ ] Confirm the repository URL and the GitHub account that sends the request.
- [ ] Submit via the GitHub Support contact form (support.github.com/contact), choosing the sensitive-data removal option.
- [ ] Replace every `[CONFIRM: ...]` and `[YOUR ...]` placeholder in the body.
- [ ] Do not paste secret values, tokens or key material anywhere: not in the form, not in attachments, not in this file.

## Subject

Request to purge cached views and PR refs that reach a leaked-credentials commit in rish106-hub/CoverSaath

## Body

Hello GitHub Support,

I own the repository https://github.com/rish106-hub/CoverSaath. I am writing to ask for help removing sensitive data that is still reachable from it.

Commit e50da7126a1bf6b2f8b91bc1391aa906192e6a95 added a file, `.claude/launch.json`, that contained two values for a prototype: a bootstrap token and a document encryption key. I have since rewritten the history with git filter-repo to remove that file, and I force-pushed. The default branch (main) and feat/supabase-postgres no longer contain that commit. The current main head is 7462761.

The original head commits of the pull requests below still contain commit e50da7126a1bf6b2f8b91bc1391aa906192e6a95. All of these pull requests are already merged. I cannot remove `refs/pull/*` references myself, so I need your help.

| PR | Original head commit |
| --- | --- |
| 25 | 05aad7378dc42a6e508f4f4df82c89bad112e243 |
| 26 | f9b687fa4d9439ff204b87d8f679883749bc9760 |
| 27 | 79f4b8042cdc270eca9fe26707f237f6804f6df9 |
| 28 | ce6002fc90389f2c855041733f5f51a303f22b78 |
| 29 | 8152471931fae128950a735e0d09bb6c013aa91c |
| 30 | 3783c2e3ce5768243ef6feb89c725f4b7adc0520 |
| 31 | fef1b5b6966c8c8fef576898686090da3e5f9421 |
| 32 | 6f33cbcd857d6d2581d349c1903da208ed894e30 |
| 33 | f1a9c38657b138986394ad356a4050bd4bbb71b6 |
| 34 | ef357153afa8656c82a550f6fb2c63aba8055f9a |
| 35 | 523ccd107cff88e9d57d137892c4b51aeb53fc1a |
| 36 | 5b31739150de280b0228d62b279223b2d3f33137 |
| 37 | d2a60faea63a2d838584ff63cbd2084585206462 |
| 38 | 1ca86b1ff42ada5d142e460d0aa0829348192821 |
| 39 | f0e4b90e0e3a76cd082cff3c5494b12121b2d370 |
| 40 | 067bdcc66fc36cb18382732ea9f552dd4ef3c84c |
| 41 | feadd1311046303de90bfa3ce905185150df0b5b |
| 42 | 825cdff2e2db748bedf6366d233fce854bc5113a |
| 43 | 305e2d9a957260fdace64eaeee110894532746fe |
| 44 | 434de7ee66bde11f83940fae579cb59e57e5893c |
| 45 | 56f4fa5e3ee2f6c3f857c679767105c77ff6719e |
| 46 | a03e6cd1e64d116cf7fad7404ba18b530b02ba03 |
| 47 | 1b6a5166675da9c4a6be273494076ae942a86cc2 |
| 49 | 68e3fbb31343d568ff802af44c15c4f1ad8bb1c0 |

Severity: the values were exposed in the repository history. The project is a prototype that uses synthetic data only. [CONFIRM: no real user data was protected by these values]

Rotation status: [CONFIRM: both credentials have been rotated on <date>]

Please:

1. Remove the cached views and the `refs/pull/N/head` and `refs/pull/N/merge` references that reach commit e50da7126a1bf6b2f8b91bc1391aa906192e6a95, for the pull requests listed above.
2. Run garbage collection on the repository afterwards, so the objects become unreachable and are pruned.
3. Confirm in writing when this is done, and tell me whether any other pull request or fork references that commit.
4. Tell me if anything else still serves the content, such as forks, cached views or search indexes.

Thank you for your help.

Regards,

[YOUR NAME]
[YOUR GITHUB USERNAME]

## What to expect

- Support may ask you to verify that you own the repository.
- Purging can take several days.
- Rotation is the real fix. Anyone who already fetched the commit keeps a copy, so treat both values as exposed regardless of the purge.
