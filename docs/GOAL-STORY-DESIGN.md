# Goal tab / New Story — design decisions (owner, 2026-10-06)

Status: decisions recorded. Build in progress as `clarvoyance_v268.html` (candidate, not live).
v267 (story-text fix) is a separate candidate awaiting full verify and the owner's go-ahead.

## Decisions

1. **Audio bar appears only inside a goal or story.** It shows that item's audio, is playable there, and disappears on back.
2. **Recording lives in the bar, not at the top.** Remove the top 🎙 button. When an item has no audio, the bar shows "🎙 Record autosuggestion".
3. **No gap between the audio bar and the bottom nav.** The bar sits directly on the nav. The page gets bottom padding equal to the bar height, so scrolling stops above the bar and nothing slides behind it.
4. **Right swipe goes back** from a goal, story, or new-goal page. The photo viewer keeps its own gestures.
5. **New goal form has an "Add photos" option** after the title.
6. **Details are always visible, not collapsed.** Why, how I'll feel, target date and category sit below the photo grid as a normal section. Category is shown locked (set once at creation).
7. **New Story text fix** (v267): `c9_goal` raw text is read safely. Live still v266 until verify passes and the owner says go.
8. **Vision images move into New Story.** The Vision folder is removed from the Goal tab. Its photos become New Story's photos, shown in a triple grid. Storage and sync stay where they are (`user_goals.vis_images`).
9. **New Story gets its own audio** with the same bar and behaviour as a goal.
10. **Tile cover:** the New Story tile shows the first story photo. The "Picture for tile" button is replaced by "+ Add photos" inside the story grid.

## Open defaults (confirm later)
- New Story's grid also shows goal photos, read-only, and tapping one opens that goal. (Default: yes.)
- Vibe feed keeps reading all photos (story + goals), so nothing is lost there.
- Details section: no collapse.

## Next sections to discuss in the same session
- (to be added as the owner raises them)
