# Agent Black Box × App Composer — Siren edition

[Watch 1080p](Agent-Black-Box-Explainer.mp4) · [Download 480p](Agent-Black-Box-Explainer-480p.mp4) · [Transcript](TRANSCRIPT.md) · [Captions](Agent-Black-Box-Explainer.srt)

The revised walkthrough uses **Siren – Natural realistic conversational voice** (`eXpIbVcVbLo8ZJQDlDnl`) with **Eleven v4** (`eleven_v4`). The script follows the Orwell writing skill: concrete actions, ordinary words, fewer caveats and a natural sequence from bug to fix. It introduces App Composer early and shows its role in the build.

## What the video shows

- An actual imported record, synchronized graph and timeline, failing tests, the patch and successful verification.
- Explicitly approved sharing and a read-only report.
- Three separately defined applications, their own configuration and separate private/public storage.
- Actual manifest and service-binding files, Composer validator output, and executed independent-update test output.

The architecture and source views in `showcase.html` are an explanatory presentation generated from this repository. They are not screenshots of Composer’s hosted stack editor. The public Composer website timed out in Chromium twice; it is linked and credited rather than represented as successfully recorded. `build-showcase.py` reads the files and executed logs used in the presentation.

## Attribution and limits

[App Composer](https://composer.loftwah.com/) by [Loftwah](https://github.com/loftwah/app-composer) contributes the reused manifest, composition-validation and promotion contracts. This project follows its independent Worker model. Our local adapter and workerd integration tests exercise those boundaries; native editor registration and cloud deployment are separate operations. See [architecture](../../docs/ARCHITECTURE.md) and [source research](../../docs/RESEARCH.md).

The recorded inventory task used an intentionally prepared defect; file operations, commands, failures, patch and successful tests were actually executed. That provenance remains in the accompanying evidence, without interrupting the narration or covering the video with a disclaimer. It is not represented as a production incident. Kujo RunLedger records the run receipt; detailed replay events come from the recorder. The reports in this video run locally.

[ElevenLabs model documentation](https://elevenlabs.io/docs/overview/models) identifies `eleven_v4`. All ten takes were actually synthesized using that model and the selected Siren voice. Request IDs, payload hashes and character alignment are retained in `assets/*.json`. The API key lacks `models_read`, so model discovery used official documentation; voice lookup and synthesis succeeded. No credentials are stored.

## Production and reproduction

The original audio takes are retained. `master-narration.py` produces WAV derivatives with measured two-pass loudness normalization. `capture.mjs` records the real application and the repository-backed source presentation. `assemble.py` maintains the native editable Tesseract project. The final renderer is the documented FFmpeg path because Tesseract 0.2.0 export was impractically slow on this machine. The earlier diagnostic is retained in the original walkthrough's local evidence; no new native-export success is claimed.

The editable `.tsrct`, raw browser capture and mastered WAVs remain in the owner's local project. The public repository includes the finished videos, transcript, captions, source presentation, original compressed narration and reproduction scripts; large authoring intermediates are excluded from publication.

Run the application with `npm run dev`. Run the producer scripts in `.tesseract-work/` from the repository root. Set `ELEVENLABS_API_KEY` for paid synthesis, or use the existing local Keychain integration. Existing unchanged takes are cached. Set `TSRCT` if Tesseract is outside PATH. Import new media under unused native asset IDs before assembling. The original execution fixture is `../real-world-explainer/evidence/recorded-run.json`.

Typography: Inter 4.1, SIL Open Font License (`assets/Inter-OFL.txt`). No music or cloned voice. Full perceptual audio audition is unavailable in this environment; provider alignment, audio measurements and encoded video frames are checked instead.

## Verification

The Siren-video Loop milestone passed 17 Node tests, six browser tests, build, whitespace and media gates. Both encoded videos passed full decode, duration, dimensions and audio-stream checks. All ten narration records identify the requested Siren voice and `eleven_v4`. The final encoded contact sheet was inspected across all ten chapters. Measured audio is -16.54 LUFS and -1.36 dBTP; the strict helper's -16 to -14 LUFS window reports false, retained in the evidence. Perceptual listening was not performed.
