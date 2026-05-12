# overflow-anchor Chat Scroller

A demo chat app that stays pinned to the bottom using pure CSS scroll anchoring — no `scrollTop = scrollHeight`, no `requestAnimationFrame`, no scroll event listeners.

**[Live demo](https://joeflateau.github.io/chat-scroller-example/)**

## How it works

The [CSS Scroll Anchoring spec](https://drafts.csswg.org/css-scroll-anchoring/) lets the browser automatically adjust scroll position when content is added above the current viewport. By controlling which elements are eligible as the "anchor node", we can make the browser keep us pinned to the bottom as new messages arrive.

### The DOM structure

```
#scroller              (overflow-y: auto)
  #scroll-content      (overflow-anchor: none → excluded subtree)
    message bubbles…
  #anchor              (overflow-anchor: auto → the only viable anchor candidate)
```

### The CSS

```css
#scroll-content {
  overflow-anchor: none;       /* exclude all messages from anchor selection */
  min-height: calc(100% + 50px); /* guarantee scrollTop > 0 so anchoring activates */
}

#anchor {
  overflow-anchor: auto;       /* this is the anchor the browser latches onto */
  height: 50px;                /* hidden behind the composer via -mt-[50px] + z-10 */
}
```

### Key spec requirements

1. **`scrollTop > 0`** — The spec won't select an anchor node if the scroller isn't scrolled away from the origin ([§2.1 step 2](https://drafts.csswg.org/css-scroll-anchoring/#anchor-node-selection)). The `min-height: calc(100% + 50px)` on `scroll-content` ensures there's always overflow.

2. **Anchor must not be in an excluded subtree** — `overflow-anchor: none` excludes the element *and all descendants*. The anchor must be a **sibling** of the excluded content, not a child.

3. **Suppression triggers** — Changes to `margin`, `padding`, `height`, `position`, or `transform` on elements between the anchor and the scroller will [suppress the adjustment](https://drafts.csswg.org/css-scroll-anchoring/#suppression-triggers). All layout properties must be static.

## Things we learned the hard way

Getting `overflow-anchor` to work as a "stick to bottom" mechanism is surprisingly tricky. The spec was designed to *prevent* unwanted scrolling, not to *create* auto-scrolling. Here's every dead end we hit:

### `overflow-anchor` doesn't scroll for you

This is the biggest misconception. Scroll anchoring only **prevents the viewport from shifting** when content changes above the anchor. It doesn't scroll *to* the anchor. If you're already at the bottom and content is added above the anchor, anchoring keeps you there. But you need to *get* to the bottom first.

### `scrollTop` must be non-zero

[§2.1 step 2](https://drafts.csswg.org/css-scroll-anchoring/#anchor-node-selection): *"If S is not scrolled away from the origin of its scrolling area, then do not select an anchor node for S."* If the scroller starts with `scrollTop = 0`, anchoring simply won't engage — the browser won't even look for an anchor. We solved this with `min-height: calc(100% + 50px)` on the content wrapper, which guarantees overflow exists. A `useLayoutEffect` then scrolls to the bottom on mount, before the first paint.

### `overflow-anchor: none` creates an excluded subtree

The spec says an element with `overflow-anchor: none` is an [excluded subtree](https://drafts.csswg.org/css-scroll-anchoring/#anchor-node-selection) — meaning the element **and all its descendants** are ineligible as anchor candidates. We initially had the anchor *inside* a wrapper with `overflow-anchor: none`, and it was silently ignored. The fix: make the anchor a **sibling**, not a child.

We also tried `#scroller * { overflow-anchor: none }` — but this matched the anchor's parent wrapper too, which excluded the anchor via the subtree rule.

### Wildcard selectors are dangerous

`#scroller * { overflow-anchor: none }` seems intuitive — "exclude everything, then opt the anchor back in." But `*` matches *every* descendant, including any wrapper around the anchor. Since excluded subtrees include all descendants, the anchor gets excluded even with an explicit `overflow-anchor: auto`. The solution is to apply `overflow-anchor: none` to a specific content wrapper, not with a wildcard.

### Absolute positioning excludes elements

We tried making the anchor `position: absolute` to hide it visually. The spec explicitly excludes absolutely-positioned elements whose containing block is an ancestor of the scroller from anchor candidate selection. Same goes for `position: fixed` and `position: sticky`.

### Suppression triggers cancel adjustments silently

[§2.2.2](https://drafts.csswg.org/css-scroll-anchoring/#suppression-triggers) lists properties that, if their **computed value changes** on any element between the anchor and the scroller during the same frame, will suppress the scroll adjustment entirely. This includes `margin`, `padding`, `width`, `height`, `min-height`, `max-height`, `position`, and `transform`. We initially tried using negative margins to hide the anchor — this works as a static style, but would break if any of these properties were animated or toggled dynamically.

### `flex-direction: column-reverse` doesn't help

We tried reversing the flex direction so the "bottom" is actually the origin. This does reverse the scroll direction, but the spec's "scrolled away from origin" check still applies to the *logical* origin, which flips too. It created more confusion than it solved.

### The anchor must be visible

The spec requires the anchor candidate to be [partially or fully visible](https://drafts.csswg.org/css-scroll-anchoring/#anchor-node-selection) in the scrolling box. A zero-height anchor or one completely clipped outside the viewport won't be selected. Our anchor is 50px tall, tucked behind the composer bar with `-mt-[50px]` and `z-10` on the composer — visible to the scroll algorithm but invisible to the user.

### Scroll-to-bottom button for free

Since the anchor is already a sentinel at the bottom of the scroll area, an `IntersectionObserver` on it tells us whether the user is at the bottom — no scroll math needed. When the anchor leaves the viewport, show a ↓ button. Clicking it sets `scrollTop = scrollHeight`, which puts the anchor back in view and re-engages anchoring.

## Browser support

Works in Chrome, Edge, and Firefox. Safari does not yet support `overflow-anchor`.

## Running locally

```sh
npm install
npm run dev
```
