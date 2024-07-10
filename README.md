# flatiron-se-phase-1-project

App Name:

Dave's Journal


Description:

This is a personal journalling web app. Users can create journal entries, highlight ones that mean a lot to them, archive ones that they don't want displayed, and edit posts that need tweaking.

All edits, highlights, archive operations are persisted to the server, as well as onscreen in realtime. In this case, the server is a locally-hosted db.json file with al the data in it.


Installation instructions:

Fork this repo and clone a local copy to your machine.

From the src directory, run (or install, if needed) json.server on the db.json file on port 3000.

Change directories to the root for the project and open index.html in your preferred browser (Chrome recommended).


Usage instructions:

All existing journal entries will load with the page. To read them, simply scroll through the entry stack in the centre of the screen.

To create a new journal entry, click on the top-most button in the control stack, to the right of the journal entries. When the entry form opens, simply type in a title and an entry.

To post the entry, you can click on the post-entry button in the lower righthand corner of the entry form. Conversely, pressing the left control key and the enter key simultaneously will post the entry, too.

To abort an entry and exit the form, click on the cancel entry button in the lower righthadn corner of the entry form. Conversely, pressing the escape key while the entry form is open will abort an entry and close the form. Once an entry is aborted and the form closed, the entry will be deleted permanently.

Each entry in the entry stack has 3 buttons in the upper righthand corner. The first button (leftmost) archives the post. This is a soft delete that removes the post from the entry stack but not from the db.json file. The second button is an edit button. Clicking this button will allow you to edit the journal entry in the same entry form window. All entry form functionality is consistent with the functionality when creating a new entry. The last button can be used to highlight meaningful or insightful posts. Once a post is highlighted, the highlight can be removed by clicking the highlight button for a second time.

Under the button used to create a new entry, there are 2 additional buttons. The middle button in the control stack filters the page so that only highlighted entries are visible. Clicking this button for a second time will toggle back to viewing all active journal entries. The bottom button in the control stack toggles the view so that only archived posts are visible. Pressing this button again will toggle back to the active posts.

In archive view, you'll notice that each entry has only a single button, which can be used to restore the post to the active journal.


License:

This is free and unencumbered software released into the public domain.

Anyone is free to copy, modify, publish, use, compile, sell, or
distribute this software, either in source code form or as a compiled
binary, for any purpose, commercial or non-commercial, and by any
means.

In jurisdictions that recognize copyright laws, the author or authors
of this software dedicate any and all copyright interest in the
software to the public domain. We make this dedication for the benefit
of the public at large and to the detriment of our heirs and
successors. We intend this dedication to be an overt act of
relinquishment in perpetuity of all present and future rights to this
software under copyright law.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR
OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.

For more information, please refer to <http://unlicense.org/>
