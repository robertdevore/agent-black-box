import { Playback } from "./playback.mjs";
import { gaps, metrics } from "./run.mjs";
const $ = (id) => document.getElementById(id);
const symbols = {
  request: "◎",
  start: "▷",
  decision: "◇",
  tool_call: "⌘",
  tool_result: "↳",
  file: "▤",
  test: "✓",
  verification: "✓",
  failure: "×",
  retry: "↻",
  recovery: "↗",
  completion: "◉",
};
let run,
  playback,
  timer,
  receipt,
  inspectedId,
  token = "",
  publicView = location.pathname.startsWith("/reports/");
function node(tag, text, className) {
  const n = document.createElement(tag);
  if (text !== undefined) n.textContent = text;
  if (className) n.className = className;
  return n;
}
function tell(text, link) {
  $("message").replaceChildren(node("span", text));
  if (link) {
    const a = node("a", " Open public report ↗");
    a.href = link;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    $("message").append(a);
  }
  const dismiss = node("button", "×");
  dismiss.setAttribute("aria-label", "Dismiss notification");
  dismiss.onclick = () => $("message").classList.remove("show");
  $("message").append(dismiss);
  $("message").classList.add("show");
}
async function api(path, body, method) {
  const r = await fetch(path, {
    method: method || (body ? "POST" : "GET"),
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: "Bearer " + token } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const v = await r.json();
  if (!r.ok) throw Error(v.error || "Request failed");
  return v;
}
function pause() {
  clearInterval(timer);
  playback?.pause();
  updatePlay();
}
function updatePlay() {
  $("play").replaceChildren(
    node("span", playback?.playing ? "Ⅱ Pause" : "▶ Play replay"),
  );
  $("play").setAttribute(
    "aria-label",
    playback?.playing ? "Pause replay" : "Play replay",
  );
}
function setPlayback() {
  clearInterval(timer);
  if (playback.playing)
    timer = setInterval(() => {
      playback.tick();
      render();
      if (!playback.playing) clearInterval(timer);
    }, 1000 / playback.speed);
  updatePlay();
}
function load(r, saved = null) {
  pause();
  run = r;
  inspectedId = undefined;
  receipt = saved;
  $("scenario").querySelector('[value="imported"]')?.remove();
  if (saved) {
    const option = new Option("Imported execution", "imported", true, true);
    option.disabled = true;
    $("scenario").add(option);
  }
  playback = new Playback(r.events.length);
  playback.speed = Number($("speed").value);
  $("title").textContent = r.title;
  $("source-kind").textContent =
    r.source.classification === "synthetic"
      ? "SYNTHETIC EXAMPLE"
      : "RECORDED EXECUTION";
  $("subtitle").textContent =
    r.source.classification === "synthetic"
      ? "A clearly labeled simulation of a test failure and the fix that followed."
      : r.source.provider === "runledger"
        ? "A recorded RunLedger receipt. Evidence gaps stay visible."
        : "A recorded execution from " +
          r.source.provider +
          ". Evidence gaps stay visible.";
  $("timeline").max = r.events.length - 1;
  $("position-total").textContent = " / " + r.events.length + " events";
  $("event-count").textContent = r.events.length + " NODES";
  const m = metrics(r);
  for (const k of ["events", "tools", "files", "failures", "checks"])
    $("metric-" + k).textContent = m[k] ?? "Unknown";
  $("metric-duration").textContent =
    m.durationMs === null ? "Unknown" : (m.durationMs / 1000).toFixed(1) + "s";
  $("coverage").textContent =
    (r.source.classification === "synthetic"
      ? "Synthetic fixture, not an authentic agent trace. "
      : "Recorded source claims; not independently certified. ") +
    "Only supplied events are shown. No hidden reasoning. Provider: " +
    r.source.provider +
    ".";
  $("gaps").replaceChildren(...gaps(r).map((g) => node("li", g)));
  render();
}
function render() {
  const i = playback.index,
    e = run.events[i];
  if (inspectedId !== e.id) {
    document.querySelector(".inspector-body").scrollTop = 0;
    inspectedId = e.id;
  }
  $("timeline").value = i;
  $("position").textContent = String(i + 1).padStart(2, "0");
  $("inspector-number").textContent = String(i + 1).padStart(2, "0");
  $("event-type").textContent = e.type.replaceAll("_", " ").toUpperCase();
  $("event-title").textContent = e.label;
  $("event-status").textContent =
    (e.status === "pass"
      ? "✓ Passed"
      : e.status === "fail"
        ? "× Failed"
        : e.status === "unknown"
          ? "? Unknown"
          : "● Observed") + " · source-reported";
  $("execution-state").textContent =
    (playback.playing ? "Replaying" : "Paused") + " · " + e.label;
  const metadata = [
    ["Timestamp", e.timestamp ?? "Unavailable"],
    ["Event ID", e.id],
    ["Source receipt", run.source.receiptId],
    ["Source entry", e.sourceId],
    ...(e.callId ? [["Tool call", e.callId]] : []),
    ...(e.retryOf ? [["Retries", e.retryOf]] : []),
  ];
  $("event-meta").replaceChildren(
    ...metadata.flatMap(([k, v]) => [node("dt", k), node("dd", v)]),
  );
  $("evidence").replaceChildren();
  for (const [k, v] of Object.entries(e.evidence || {})) {
    const item = node("div", undefined, "evidence-entry");
    item.append(node("h3", k.replaceAll("_", " ")));
    const pre = node("pre");
    const value = typeof v === "string" ? v : JSON.stringify(v, null, 2);
    if (k === "diff")
      value
        .split("\n")
        .forEach((line) =>
          pre.append(
            node(
              "span",
              line + "\n",
              line.startsWith("+")
                ? "syntax-add"
                : line.startsWith("-")
                  ? "syntax-remove"
                  : "",
            ),
          ),
        );
    else pre.textContent = value;
    item.append(pre);
    $("evidence").append(item);
  }
  if (!Object.keys(e.evidence || {}).length)
    $("evidence").append(node("p", "No additional evidence was supplied."));
  $("raw-event").textContent = JSON.stringify(e, null, 2);
  // Window large traces to bound DOM and layout cost. Sequence numbers retain full-trace identity.
  const columns = matchMedia("(max-width:1150px)").matches ? 2 : 3;
  const start = Math.max(0, Math.min(run.events.length - 60, i - 24)),
    end = Math.min(run.events.length, start + 60);
  const focused = document.activeElement?.dataset.event;
  $("graph-nodes").replaceChildren(
    ...run.events.slice(start, end).map((ev, offset) => {
      const ix = start + offset;
      const b = node(
        "button",
        undefined,
        "node " +
          (ix > i ? "future " : ix < i ? "completed " : "") +
          (ix === i ? "active " : "") +
          (ev.status === "fail"
            ? "failed"
            : ev.status === "pass"
              ? "passed"
              : ""),
      );
      const row = Math.floor(offset / columns),
        col = offset % columns;
      b.style.gridRow = String(row + 1);
      b.style.gridColumn = String(row % 2 ? columns - col : col + 1);
      b.dataset.edge =
        ix === run.events.length - 1 || ix === end - 1
          ? "none"
          : col === columns - 1
            ? "down"
            : row % 2
              ? "left"
              : "right";
      b.dataset.event = String(ix);
      b.setAttribute("aria-label", `Event ${ix + 1}: ${ev.label}`);
      b.setAttribute("aria-current", ix === i ? "step" : "false");
      const top = node("span", undefined, "node-top");
      top.append(
        node(
          "span",
          symbols[ev.type] + " " + ev.type.replaceAll("_", " ").toUpperCase(),
        ),
        node("span", String(ix + 1).padStart(2, "0")),
      );
      b.append(
        top,
        node("span", ev.label, "node-label"),
        node(
          "span",
          ev.status === "fail"
            ? "× Failed"
            : ev.status === "pass"
              ? "✓ Passed"
              : ev.status === "unknown"
                ? "? Unknown"
                : "● Observed",
          "node-state",
        ),
      );
      b.onclick = () => {
        pause();
        playback.seek(ix);
        render();
      };
      return b;
    }),
  );
  if (focused !== undefined)
    $("graph-nodes")
      .querySelector(`[data-event="${focused}"]`)
      ?.focus({ preventScroll: true });
  $("graph-window").textContent =
    run.events.length > 60
      ? `${start + 1}–${end} of ${run.events.length} events`
      : "Evidence, not hidden reasoning";
  $("back").disabled = i === 0;
  $("next").disabled = i === run.events.length - 1;
  updatePlay();
  if (playback.playing)
    $("graph-nodes")
      .querySelector('[aria-current="step"]')
      ?.scrollIntoView({
        block: "nearest",
        inline: "nearest",
        behavior: "instant",
      });
}
$("play").onclick = () => {
  if (playback.playing) pause();
  else {
    playback.play();
    setPlayback();
    render();
  }
};
$("restart").onclick = () => {
  pause();
  playback.restart();
  render();
};
$("back").onclick = () => {
  pause();
  playback.step(-1);
  render();
};
$("next").onclick = () => {
  pause();
  playback.step(1);
  render();
};
$("timeline").oninput = (e) => {
  pause();
  playback.seek(e.target.value);
  render();
};
$("speed").onchange = (e) => {
  playback.speed = Number(e.target.value);
  setPlayback();
};
document.addEventListener("keydown", (e) => {
  if (
    document.querySelector("dialog[open]") ||
    ["INPUT", "TEXTAREA", "SELECT", "BUTTON", "A", "SUMMARY"].includes(
      e.target.tagName,
    )
  )
    return;
  if (e.code === "Space") {
    e.preventDefault();
    $("play").click();
  }
  if (["ArrowRight", "ArrowLeft"].includes(e.code)) {
    e.preventDefault();
    (e.code === "ArrowRight" ? $("next") : $("back")).click();
  }
});
for (const b of document.querySelectorAll("[data-close]"))
  b.onclick = () => b.closest("dialog").close();
$("import-open").onclick = () => {
  pause();
  $("import-dialog").showModal();
};
$("file").onchange = async () => {
  const f = $("file").files[0];
  if (!f) return;
  if (f.size > 1048576) return tell("Maximum receipt size is 1 MiB");
  $("import-json").value = await f.text();
};
$("import-form").onsubmit = async (e) => {
  e.preventDefault();
  token = $("owner-token").value;
  try {
    const input = JSON.parse($("import-json").value);
    const saved = await api("/api/runs", input);
    load(saved.run, saved);
    $("import-dialog").close();
    tell("Imported privately. Review evidence before publishing.");
  } catch (err) {
    tell(err.message);
  }
};
$("publish-open").onclick = async () => {
  pause();
  try {
    if (!receipt) receipt = await api("/api/runs", run);
    $("publish-preview").textContent = JSON.stringify(receipt.run, null, 2);
    $("approve").checked = false;
    $("publish-dialog").showModal();
  } catch (err) {
    tell(err.message + " — use Import receipt to enter the owner token.");
  }
};
$("publish-form").onsubmit = async (e) => {
  e.preventDefault();
  if (!$("approve").checked) return;
  try {
    const result = await api("/api/publish", {
      receiptId: receipt.id,
      digest: receipt.digest,
      approved: true,
    });
    $("publish-dialog").close();
    tell("Approved snapshot published.", result.url);
  } catch (err) {
    tell(err.message);
  }
};
$("scenario").onchange = async () => {
  try {
    load(
      await (
        await fetch(
          "/fixtures/" +
            ($("scenario").value === "recovery"
              ? "recovery.json"
              : "success.json"),
        )
      ).json(),
    );
  } catch {
    tell("Example could not be loaded.");
  }
};
try {
  if (publicView) {
    $("mode").textContent = "PUBLIC · READ ONLY";
    $("import-open").hidden = true;
    $("publish-open").hidden = true;
    document.querySelector(".scenario-label").hidden = true;
    const id = location.pathname.split("/")[2];
    const saved = await api("/api/public/" + encodeURIComponent(id));
    load(saved.run);
    $("subtitle").textContent = saved.disclosure;
    document.title = run.title + " — Agent Black Box";
  } else load(await (await fetch("/fixtures/recovery.json")).json());
} catch (err) {
  tell(err.message);
  $("title").textContent = "Report unavailable";
  for (const el of document.querySelectorAll(".controls button"))
    el.disabled = true;
}

matchMedia("(max-width:1150px)").addEventListener("change", () => {
  if (run) render();
});
