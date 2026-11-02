# Publishing the source

The working repository contains local memory records, agent context and earlier video iterations. Publish a clean source snapshot rather than pushing that private working history.

`scripts/prepare-public.py DESTINATION` creates a new, empty-directory snapshot from committed files. It excludes agent prompts, memory/handoff files, raw iteration diffs, obsolete video sources and large authoring intermediates. It replaces local user paths in text with placeholders. It does not create a repository or upload anything.

Review the snapshot, scan for secrets and internal identifiers, install dependencies, and run `npm run verify` there. Initialize its own Git history, then create/push an explicitly authorized GitHub repository. The public snapshot retains source ownership boundaries, tests, verified fixtures, upstream licenses, Composer attribution and the finished Siren videos. Never push the original working Git objects to the public destination.

Application deployment remains separate. Source publication does not imply native Composer editor registration or a live hosted report service. The initial local-build reports remain historical evidence; the current video guide documents the later narration and visual review.
