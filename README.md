## Overview

Your task is to implement a keyboard-driven command interface for a web-based spreadsheet application, similar to Excel's KeyTips feature. This system allows users to execute spreadsheet commands through sequential keyboard shortcuts.


## Features

This project implements a KeyTips system for the embedded SpreadJS spreadsheet. Key implemented features:

- Activation & flow: press Alt (Windows/Linux) or ⌘ (Mac) to open the KeyTips overlay and enter sequential keys to navigate and execute commands.
- Implemented KeyTips: Paste Values (Alt/Cmd -> H -> V -> V), Border Bottom (H -> B -> B), Border Top (H -> B -> T), AutoFit Column (H -> O -> I), Sort Descending (A -> S).
- Trie-based matcher and declarative registry (`src/keytips/registry.ts`) for scalable sequences and next-key hinting.
- `KeytipsProvider`: centralized activation, sequence capture, toast notifications, and SpreadJS action execution context.
- `KeytipOverlay`: portal-mounted, draggable, keyboard-navigable overlay with breadcrumb, key badges, and footer hints.
- Paste Values: robust clipboard handling (TSV parsing), values-only paste, fallback to SpreadJS paste when clipboard access is blocked, and user-facing toasts for errors.
- SpreadJS action wrappers (`src/keytips/actions/*.ts`) for borders, autofit, sort, and paste-values.
- Top-right toast system for errors and feedback (stacking, auto-dismiss).
- Safeguards while overlay active: keystroke capture, temporary disabling of grid shortcuts and in-cell editing, and restoration when overlay closes.

## Next Steps

1. Add conflict detection in the KeyTip `registry.ts` (e.g., duplicate sequences).

2. KeyTip Creation by listening: Add the Excel tool menu and write a KeyTipCreation user flow to let users create new toolTips. Users could execute a certain set of commands, and the app would track their history of excel commands and let the user define a new KeyTip shortcut.

3. Undo/redo integration: Wrap actions in transactions so each keytip is a single undo/redo step.

4. Implement more KeyTips such as fill down, bold/italic, number formats, wrap text, alignments, etc. 

5. Fuzz test app and handle unforseen edge cases. 

**Deliverables**: A working implementation and documentation in a GitHub pull request.

## What are KeyTips?

KeyTips provide keyboard accessibility by:

* Activating with Alt (Windows/Linux) or Cmd (Mac)
* Showing visual overlays of available keyboard shortcuts
* Allowing sequential key presses to navigate and execute commands
* Example: Alt → H → V → V executes "Paste Values"

Watch this [Excel KeyTips demonstration](https://www.youtube.com/watch?v=emU9KcZKw9k) to understand the user experience. Note: The ribbon interface shown is not required for your implementation.

You can also see [how KeyTips are implemented in Meridian](https://drive.google.com/file/d/1-GANv2HjCTGD7TGFt6htRV2emEpIIZDn/view?usp=sharing) for reference. Note: Your UI implementation does not need to look the same as Meridian's interface.

## Why This Matters

For many financial professionals—especially in banking and consulting—Excel is their IDE. They rely almost entirely on the keyboard, navigating and editing at high speed with muscle memory alone. Reaching for the mouse breaks flow. KeyTips aren’t just a nice-to-have—they’re essential to preserving the kind of power-user experience that makes spreadsheets feel seamless. This assignment simulates how we bring that level of keyboard-driven efficiency into a modern, web-based spreadsheet environment.

## Requirements

### 1. Implement These 5 KeyTips

| Shortcut            | Action          | Description                             |
| ------------------- | --------------- | --------------------------------------- |
| Alt/Cmd + H + V + V | Paste Values    | Paste only values (not formulas)        |
| Alt/Cmd + H + B + B | Border Bottom   | Add bottom border to selected cells     |
| Alt/Cmd + H + B + T | Border Top      | Add top border to selected cells        |
| Alt/Cmd + H + O + I | AutoFit Column  | Adjust column width to fit content      |
| Alt/Cmd + A + S     | Sort Descending | Sort selected cells in descending order |

### 2. User Experience Requirements

* **Activation**: Pressing Alt/Cmd should activate the KeyTips system
* **Sequential Input**: Keys are pressed one at a time (not simultaneously)
* **Visual Feedback**: Display the currently active key sequence
* **Cancellation**: Allow users to exit at any point (Esc or clicking away)
* **Action Behavior**: Each action should work equivalently to Google Sheets

### 3. Technical Requirements

* Design the system to support 100+ potential keytips (not just the 5 required)
* Use the provided spreadsheet library
* Create a `keytips.md` file explaining how to add new keytips

### 4. Documentation & Submission

Submit a PR containing:

* Your implementation code
* `keytips.md` - Instructions for adding new keytips
* Updated README listing what you would improve to consider the system "production grade", ranked by importance

## Getting Started & Submission Steps

1. Clone this repository locally and create a separate private repo for permission (add gfang200 as a collaborator)
2. Install dependencies:

   ```bash
   npm install
   ```
3. Start the development server:

   ```bash
   npm run start
   ```
4. Implement the KeyTips system
5. Push your work to your cloned private repository and share the link

## What We're Looking For

**Take the time you need.** There’s no strict time limit — most people naturally spend around 3 hours, but what matters is that you end up with something you’re comfortable sharing. The most important thing is that the features work and are usable. The code doesn’t need to be production-ready, but it should be clear, reasonable, and not wildly over-engineered. We care most about seeing your ideas expressed in a way that feels coherent and practical.

We love to see:

* A clear thought process and systematic approach to implementation challenges
* Working, usable features that show a good balance between functionality and engineering
* Thoughtful handling of edge cases and sensible application of best practices
* Effective use of AI tools, documentation, and other resources to move quickly and smartly
* Ability to extend and interpret requirements beyond the bare minimum examples

Remember: this is about showcasing how you approach building something you can be proud of. Keep the features usable, the ideas clear, and the code grounded in good judgment.

## Tips

* Use AI tools effectively but don't get stuck. SpreadJS documentation ([https://developer.mescius.com/spreadjs/docs/overview](https://developer.mescius.com/spreadjs/docs/overview)) is also a great resource
* Try performing these operations manually in Google Sheets to understand the expected behavior and user experience
* Consider how the system should handle cases like invalid key sequences
* Feel free to make implementation decisions that best showcase your skills!

Good luck! If you have questions about how any specific Google Sheets behavior works, please ask for clarification.
