# Web UI improvement plan

## Implementation status

The friendly-modern foundation and primary workflow redesign are implemented:

- compact Run / Protocols / Learn shell with legacy hash compatibility;
- light semantic design tokens and app-owned responsive component styling;
- guided Quick local run and Connect a participant task selection;
- one readiness banner and collapsed local-cluster diagnostics;
- progressive disclosure for threshold, sample inputs, and cluster behavior;
- compact, honest request progress plus actionable errors;
- outcome-first Quick Run results with copy and run-again actions;
- numbered participant-submission sections and collapsed security settings;
- calmer Protocols and Learn surfaces, reduced operational motion, skip link,
  mobile layouts, and matched English/Chinese copy.

The existing backend API remains unchanged. Automated browser accessibility and
visual-regression coverage remains a follow-up because the frontend currently
has no browser-test dependencies; lint, localization parity, TypeScript, and the
production build provide the current automated gate.

## Goal

Make the psinsieme Web UI feel approachable on first use, pleasant in daily use,
and capable without looking complicated. A new user should be able to run a
local PSI example without understanding cluster topology, protocol families, N,
t, dealer processes, or mTLS.

The visual direction should keep the friendly Animal Island personality while
reducing decoration around operational controls. Status, actions, and results
must remain easy to scan.

## Product principles

1. **One obvious next action.** Each screen should have one visually dominant
   primary action and plainly state what the user should do next.
2. **Simple first, detail on demand.** Show safe defaults initially. Put network,
   TLS, threshold, custom-input, and diagnostic controls behind clearly named
   advanced sections.
3. **Use user language.** Prefer “Participants” and “Minimum matches” in the
   primary UI; retain N and t as secondary technical labels or tooltips.
4. **Status should explain consequences.** Do not only say “stopped” or “not
   built”; explain whether the user can continue and offer the relevant action.
5. **Consistency over novelty.** Reuse a small set of spacing, color, type,
   field, button, alert, and result patterns across every page.
6. **Accessible by default.** Keyboard operation, visible focus, sufficient
   contrast, reduced motion, semantic feedback, and mobile layouts are release
   requirements.

## Current-state findings

- The app already has strong foundations: English/Chinese parity, responsive
  breakpoints, reduced-motion support, focus styles, localized API errors, and
  protocol-specific guardrails.
- The console presents four summary tiles and then repeats much of the same
  build/dealer/party/transport status in the cluster card.
- Protocol selection appears in the cluster, demo, and practical flows. This
  makes the dependency between cluster configuration and a run harder to follow.
- Demo mode exposes protocol category, protocol, N, t, automatic cluster
  management, and input customization together. Most are unnecessary for a
  first successful run.
- “Demo” and “Practical” are implementation-oriented names. The difference
  between a coordinated local run and submitting one party's data is not
  immediately obvious.
- The global navigation gives equal weight to five destinations. Educational
  material is extensive and visually rich, but competes with the product's main
  operational flow.
- The hero consumes substantial vertical space and includes decorative mascot,
  clock, language control, and animation before the primary task.
- The UI stylesheet is about 3,900 lines and `InfoPages.tsx` is about 1,100
  lines. Repeated/late overrides make future visual consistency harder.
- There are no frontend component or end-to-end tests. The current lint,
  localization check, TypeScript build, and Vite production build all pass.
- The production bundle includes several 1.1–1.5 MB CJK/Japanese font files;
  initial-load performance needs explicit measurement and optimization.

## Target information architecture

Use three primary destinations:

- **Run** — the default workspace for a quick local example or a real-party
  submission.
- **Protocols** — protocol availability, comparison, requirements, and details.
- **Learn** — Why PSI, Getting Started, and Project information grouped within
  one section.

Keep language and help controls in a compact header. Move the clock and backend
implementation filename out of the primary shell. Preserve project attribution
in a restrained footer or About panel.

On narrow screens, use a compact scrollable tab bar or a menu with a persistent
page title. Navigation labels must remain text-visible, not icon-only.

## Target Run experience

### 1. Choose a task

Lead with two plain-language choices:

- **Quick local run** — “Try PSI with sample data; the app manages local
  services for you.” This is the recommended default.
- **Connect a participant** — “Submit this participant's data to an existing
  deployment.” This is the advanced/real-world path.

Remember the user's last choice locally, while always making the active mode
obvious.

### 2. Quick local run

The default form contains only:

- a protocol choice presented as 2–4 comparison cards or a single recommended
  option when only one protocol is built;
- participant count, only when the chosen protocol allows it;
- a large **Run example** button.

Use safe defaults for threshold, automatic cluster management, and generated
sample inputs. Place these in **Customize run**:

- minimum participants/threshold;
- edit each participant's data;
- cluster management behavior;
- TLS when relevant.

Show a compact sentence above the button summarizing the operation, for example:
“Run KS05 with 3 participants; at least 2 must share an item.” Update it live.

### 3. Connect a participant

Present a short, ordered flow:

1. Connection — participant endpoint and leader endpoint.
2. Role and protocol — with sensible defaults and protocol constraints applied
   automatically.
3. Data — one item per line, with a live item count and a small example action.
4. Review and submit — a plain-language summary followed by **Submit securely**.

Put mTLS certificates and uncommon protocol parameters inside **Security and
advanced settings**. If mTLS is enabled, show clear required/optional markers
and validate certificate fields before submission.

### 4. Progress and results

Replace large decorative loading areas with a compact progress panel that shows
the real stages available from the backend, or honest indeterminate states:

- Preparing services
- Connecting participants
- Computing intersection
- Complete

After success, scroll/focus the result summary into view. Lead with the outcome:
intersection size and values, then duration and per-party diagnostics in a
collapsible details section. Provide **Run again** and **Copy result** actions.

On failure, keep the user's input, place an error summary near the action, focus
it for assistive technology, and pair the error with a specific recovery action
such as **Start cluster**, **Change protocol**, or **Retry**.

## Cluster and system status

Remove the duplicated overview/status grids. Replace them with a single compact
status strip near the Run title:

- **Ready** — green, with “All services available.”
- **Needs setup** — amber, with the missing requirement and a fix action.
- **Running** — blue/green, with protocol and participant count.
- **Unavailable** — red only for blocking failures.

Automatic cluster management should be the default for quick runs, so manual
start/stop controls belong in a **Local cluster details** disclosure. Inside it,
show parties and dealer only when they are relevant to the selected protocol.
Do not show mTLS as a health status when it is simply switched off.

## Visual system cleanup

- Define tokens for canvas, surface, text, muted text, border, primary, success,
  warning, danger, radii, shadows, spacing, and motion. Keep semantic status
  colors separate from decorative card colors.
- Limit operational pages to one main surface style, one secondary inset style,
  and one alert style. Reserve playful card shapes and animation for Learn.
- Use a restrained type scale: page title, section title, body, label, helper.
  Keep body copy at least 16 px on mobile and avoid heavy font weight for long
  paragraphs.
- Reduce the hero to a compact product header. Keep one small mascot or brand
  illustration, but remove perpetual motion from task-focused pages by default.
- Standardize form widths, label placement, required markers, helper text,
  validation messages, and disabled/read-only presentation.
- Make the primary button visually dominant; use danger styling only for a
  confirmed destructive stop action.
- Split `index.css` by tokens/base/layout/components/pages and remove duplicate
  late overrides. Split `InfoPages.tsx` by page and feature.

## Accessibility and responsive requirements

- Meet WCAG 2.2 AA contrast for text, controls, status indicators, and focus.
- Never communicate status by color alone; pair color with an icon and text.
- Add an application-level skip link and correct landmark/heading order.
- Announce status refreshes, async progress, errors, and successful results with
  appropriate live regions without announcing every three-second poll.
- Ensure custom tabs, switches, collapses, and step controls work with keyboard
  and expose correct names, roles, states, and arrow-key behavior.
- Use 44 × 44 px minimum touch targets and prevent horizontal page scrolling at
  320 px width.
- Preserve user text and form state across mode switches and failed requests.
- Test English and Chinese at 320, 375, 768, 1024, and 1440 px, including long
  translated labels and 200% zoom.

## Delivery plan

### Phase 1 — Simplify the core journey (highest impact)

1. Introduce the Run / Protocols / Learn navigation structure.
2. Replace the large hero with the compact product header.
3. Merge duplicate status displays into the readiness strip.
4. Rename Demo/Practical to Quick local run/Connect a participant.
5. Reduce quick-run defaults to protocol, participants when applicable, and one
   primary action; move the rest under Customize run.
6. Add plain-language run summaries and actionable empty/error states.

**Exit criteria:** A first-time user can identify and start the recommended
local example in under 30 seconds without opening advanced settings.

### Phase 2 — Make feedback and results effortless

1. Add staged progress presentation and non-disruptive status announcements.
2. Redesign results around the intersection outcome, then diagnostics.
3. Add copy, run-again, and direct recovery actions.
4. Preserve input and return focus correctly on errors and completion.
5. Add confirmation before stopping an active cluster when work may be lost.

**Exit criteria:** In usability testing, users can explain whether a run
succeeded and what to do after a failure without developer assistance.

### Phase 3 — Consolidate the design system

1. Create tokens and shared primitives for page headers, sections, fields,
   status, alerts, disclosures, summaries, and results.
2. Break up the monolithic stylesheet and information-page component.
3. Reduce decorative motion and visual noise on operational pages.
4. Audit spacing, typography, contrast, and component states in both locales.

**Exit criteria:** New operational screens can be built from documented shared
patterns without page-specific overrides for standard controls.

### Phase 4 — Responsive, accessible, and fast by evidence

1. Add automated accessibility checks and keyboard-flow tests.
2. Add component tests for protocol constraints, validation, loading, error, and
   result states.
3. Add end-to-end tests for quick run and participant submission with API mocks,
   then one backend-connected smoke path.
4. Measure bundle/load performance; subset or conditionally load locale fonts,
   lazy-load Learn content, and split noncritical code.
5. Run five-task usability sessions with both novice and technical users.

**Exit criteria:** No serious automated accessibility violations; all critical
flows pass keyboard and mobile tests; initial JS/CSS and font budgets are agreed
and enforced in CI.

## Suggested implementation slices

Keep pull requests small and reviewable:

1. Navigation and compact header.
2. Readiness strip and removal of duplicate status UI.
3. Quick-run progressive disclosure.
4. Participant submission step grouping and advanced security disclosure.
5. Progress, error recovery, and result summary.
6. Design tokens and shared primitives.
7. Learn-page lazy loading and source-file split.
8. Accessibility, component, and end-to-end test harness.
9. Font/bundle optimization and performance budgets.

Each slice should preserve English/Chinese parity and pass lint, i18n validation,
production build, keyboard checks, and screenshots at mobile and desktop widths.

## Success measures

- At least 80% of first-time test users complete a quick local run without help.
- Median time to start the first run is below 30 seconds.
- Users encounter no more than three visible decisions before the default run.
- At least 90% of test users correctly identify run success/failure and the next
  available action.
- Zero critical or serious accessibility findings in the primary workflows.
- No horizontal overflow at supported widths and no clipped Chinese labels at
  200% zoom.
- Define and enforce bundle budgets after the first measured baseline; prioritize
  eliminating unnecessary multi-megabyte font downloads.

## Out of scope for the first pass

- Rebranding the project or replacing Animal Island UI entirely.
- Changing protocol semantics or backend security behavior.
- Building a full cluster administration dashboard or log explorer.
- Adding accounts, cloud deployment management, or multi-user collaboration.

These may be useful later, but they would work against the immediate goal of a
simple, friendly interface.
