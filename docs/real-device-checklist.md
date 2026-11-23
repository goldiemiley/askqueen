# Real-device checklist: sharing

Automated checks run in desktop Chrome with a simulated share menu. These steps need a real phone,
because only a real phone opens a real share menu and Instagram. Use the deployed site (or a preview
deploy); `localhost` links don't work from a phone.

Tick each item on **iPhone Safari** (iOS 17 or later) and **Android Chrome**.

## Daily roast

| # | Step | Expected | iPhone | Android |
|---|---|---|---|---|
| 1 | Get a roast, tap **Share my reading** | Sheet slides up from the bottom; preview of the Story image appears within a second | | |
| 2 | Switch **Story / Square** | Preview changes shape; text and song block are not cut off | | |
| 3 | Tap **Share image** | Phone's share menu opens straight away, showing the image | | |
| 4 | Pick **Instagram → Stories** | Image opens in the Story editor. Add the Music sticker, search the song title | | |
| 5 | Share again, pick **WhatsApp** | Image arrives with the message and link | | |
| 6 | Open the share menu, then cancel | Nothing happens; no "Shared" message | | |
| 7 | Tap **Copy link**, paste in Notes | Link starts with `.../askqueen/share/?t=daily` | | |
| 8 | Open that link in a private tab | Same sign, roast and song; song sits under the roast | | |
| 9 | Tap **Listen to a preview** on the shared page | Spotify player loads and plays a preview | | |
| 10 | Tap **Download** | iPhone: image opens / saves to Photos or Files. Android: saved to Downloads | | |
| 11 | Tap **Facebook** | Facebook opens with the link (preview shows the AskQueen site image) | | |

## Ask Queen

| # | Step | Expected | iPhone | Android |
|---|---|---|---|---|
| 12 | Ask a question, tap **Share my reading** | **Show my question** is first and switched off | | |
| 13 | Share with it off | Image and link show only Sabrina's answer | | |
| 14 | Switch it on | Warning appears, question is filled in and editable | | |
| 15 | Edit the question | Preview says "Updating preview…", then shows the edited question; Share waits until it's ready | | |
| 16 | Type a phone number or a web address | Red message, share buttons disabled | | |
| 17 | Share to WhatsApp, open the link on another phone | Question appears above Sabrina's answer, marked as written by the sharer | | |
| 18 | Share the link via Facebook Messenger and open it | Either the question shows, or only the answer (some apps drop the # part). Note which | | |
| 19 | Ask "I want to hurt myself" | Support message, no share button | | |

## Layout

| # | Step | Expected | iPhone | Android |
|---|---|---|---|---|
| 20 | Rotate to landscape with the sheet open | Sheet scrolls; Close button reachable | | |
| 21 | Turn on VoiceOver / TalkBack, open the sheet | Title read out; focus stays inside the sheet; Close works | | |
| 22 | Increase text size to the largest setting | Sheet text wraps; nothing overlaps | | |
