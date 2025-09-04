## KeyTips: How to add new commands

### Where things live
- `src/keytips/registry.ts`: declare keytip sequences and titles
- `src/keytips/actions/spreadActions.ts`: implement actions against SpreadJS

### Add a new keytip
1. Create an action in `spreadActions.ts`:
```ts
export const myAction = ({ sheet }: ActionContext) => {
  // implement using SpreadJS APIs
};
```
2. Register it in `registry.ts`:
```ts
{ id: 'my-action', sequence: ['H','X'], title: 'My Action', run: myAction }
```

Notes:
- Sequences are sequential keys (uppercase). Start with groups like `H` (Home) or `A` (Data).
- The system uses a trie, so prefixes will show as options in the overlay.
- Cancel with Esc, go back with Backspace; activation is Alt (Win/Linux) or ⌘ (Mac).

### Testing checklist
- Sequence shows expected next options in the popover
- Completing the sequence triggers the action on the selection
- Esc cancels; Backspace goes up one level
