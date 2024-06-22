document.addEventListener('DOMContentLoaded', main);

function main() {

	// load all entries

	loadEntries();

	// Object classes

	class jrnlObj {
		constructor(title, content) {
			this.title = title;
			this.content = content;
			this.pubTs = (() => new Date())();
			this.isAccent = false;
			this.isArch = false;
			this.updLog = {};
		}
	}

	class updateObj {
		constructor(id, updArr) {
			this.id = id;
			updArr.forEach(element => this[element[0]] = element[1]);
			this.lupdTs = (() => new Date())();
		}
	}

	class jrnlEntry {
		constructor(entryObj) {

			// build entry container

			this.entry = document.createElement('div');
			this.entry.className = `entry`;
			if (entryObj.isAccent) this.entry.classList.add('accent');
			if (entryObj.isArch) this.entry.classList.add('archived');
			this.entry.id = entryObj.id

			// build entry header container

			this.head = document.createElement('div');
			this.head.className = `entry_header`;

			// build entry header text container

			this.headText = document.createElement('div');
			this.headText.className = `entry_header_text`;

			// build entry actions container

			this.headActions = document.createElement('div');
			this.headActions.className = `entry_header_actions`;

			// build entry header text elements

			this.title = document.createElement('h2');
			this.title.className = `entry_title`;
			this.title.innerText = entryObj.title;

			this.pubTs = document.createElement('p');
			this.pubTs.className = `entry_publish_ts`;
			this.pubTs.innerText = formatTs(entryObj.pubTs);

			// build archive button
			
			this.archBtn = document.createElement('div');
			this.archBtn.id = `entry_archive_btn_${entryObj.id}`;
			this.archBtn.className = 'entry_archive_btn';
			this.archBtn.title = !entryObj.isArch ? 'Archive this entry' : 'Restore this entry to the journal';
			this.archBtn.addEventListener('click', () => {
				const updArr = [['isArch', !entryObj.isArch]];
				if (!entryObj.isArch) updArr.push(['isAccent', false]);
				pushUpdate(new updateObj(this.entry.id, updArr));
				const targetNode = document.getElementById(this.entry.id);
				if (!entryObj.isArch) {
					targetNode.classList.add('archived');
				} else {
					targetNode.classList.replace('archived', 'highlight');
				}
				setTimeout(() => targetNode.style.opacity = 0, 100);
				setTimeout(() => targetNode.remove(), 300);
			});

			// build edit button

			this.editBtn = document.createElement('div');
			this.editBtn.id = `entry_edit_btn_${entryObj.id}`;
			this.editBtn.className = 'entry_edit_btn';
			this.editBtn.title = 'Edit this entry';
			this.editBtn.addEventListener('click', (event) => {
				openEntryForm(event);
				const titleField = document.getElementById('entry_form_title');
				const contentField = document.getElementById('entry_form_content');
				const content = document.getElementById(this.entry.id).querySelector('.entry_content').innerText;
				titleField.value = entryObj.title;
				contentField.value = content;
				contentField.focus();
			});

			// build highlight button

			this.starBtn = document.createElement('div');
			this.starBtn.id = `entry_star_btn_${entryObj.id}`;
			this.starBtn.className = 'entry_star_btn';
			this.starBtn.title = !entryObj.isAccent ? 'Accent this entry' : 'Remove accent from entry'
			this.starBtn.addEventListener('click', () => {
				const updArr = [['isAccent', !entryObj.isAccent]];
				pushUpdate(new updateObj(this.entry.id, updArr));
				const targetNode = document.getElementById(this.entry.id);
				entryObj.isAccent ? targetNode.classList.remove('accent') : targetNode.classList.add('accent');
				entryObj.isAccent = !entryObj.isAccent;
				this.starBtn.title = !entryObj.isAccent ? 'Accent this entry' : 'Remove accent from entry'
			});

			classListAppend([this.archBtn, this.editBtn, this.starBtn], 'entry_action_btn'),

			// build entry content element

			this.content = document.createElement('div');
			this.content.className = `entry_content`;
			this.content.innerHTML = entryObj.content;

			classListAppend([this.entry, this.head, this.headText, this.headActions, this.title, this.pubTs, this.archBtn, this.editBtn, this.starBtn, this.content], entryObj.id)

			// assemble entry

			this.headText.appendChild(this.title);
			this.headText.appendChild(this.pubTs);
			this.headActions.appendChild(this.archBtn);
			this.headActions.appendChild(this.editBtn);
			this.headActions.appendChild(this.starBtn);
			this.head.appendChild(this.headText);
			this.head.appendChild(this.headActions);
			this.entry.appendChild(this.head);
			this.entry.appendChild(this.content);
		}

		render() {
			return this.entry;
		}
	}

	// State change functions

	const stateChange = {
		bgBlur: {
			on: () => document.getElementById('static_elements').classList.add('blur'),
			off: () => document.getElementById('static_elements').classList.remove('blur'),
		},
	}

	// Keydown event listeners

	const keyDownActions = {
		'F2': event => openEntryForm(event),
		'Escape': closeEntryForm,
		'Enter': {
			'ctrl': handlePublishReq,
		}
	}

	document.addEventListener('keydown', function(event) {
		const action = keyDownActions[event.key];
		if (typeof action === 'function') {
			action();
		} else if (typeof action === 'object') {
			if (event.ctrlKey && 'ctrl' in action) action.ctrl();
		}
	});

	// Button event listeners

	const newEntryBtn = document.getElementById('new_entry_btn');
	const viewArchBtn = document.getElementById('view_archive_btn');
	const viewActiveBtn = document.getElementById('view_active_btn');

	newEntryBtn.addEventListener('click', event => openEntryForm(event));
	viewArchBtn.addEventListener('click', event => handleArchiveStatus(event));
	viewActiveBtn.addEventListener('click', event => handleArchiveStatus(event));

	// Administrative functions

	function handleArchiveStatus(event) {
		const showArchive = event.target.id.includes('archive');
		const entryStack = document.getElementById('entry_stack');
		entryStack.innerHTML = '';
		loadEntries(showArchive);
		switch (showArchive) {
			case true:
				newEntryBtn.style.display = 'none';
				viewArchBtn.style.display = 'none';
				viewActiveBtn.style.display = 'flex';
				break;
			default:
				newEntryBtn.style.display = 'flex';
				viewArchBtn.style.display = 'flex';
				viewActiveBtn.style.display = 'none';
				break;
		}
	}

	function openEntryForm(event) {
		document.getElementById('page_header').classList.add('blur');
		document.getElementById('page_content').classList.add('blur');
		const formCont = buildEntryForm(event);
		document.body.appendChild(formCont);
		setTimeout(() => formCont.style.opacity = 1, 50);
	}

	function closeEntryForm() {
		const formCont = document.getElementById('entry_form_container');
		formCont.style.opacity = 0;
		document.getElementById('page_header').classList.remove('blur');
		document.getElementById('page_content').classList.remove('blur');
		setTimeout(() => formCont.remove(), 500);
	}

	function showErrorCallout() {
		const contStack = document.getElementById('control_stack form');
		contStack.appendChild(buildErrorCallout());
		const errCall = document.getElementById('error_callout');
		setTimeout(() => errCall.style.opacity = 1, 50);
	}

	function hideErrorCallout() {
		const errCall = document.getElementById('error_callout');
		errCall.style.opacity = 0;
		setTimeout(() => errCall.remove(), 500);
	}

	function handlePublishReq() {
		const entryTitle = document.getElementById('entry_form_title').value;
		const entryBody = document.getElementById('entry_form_content').value;
		switch (entryTitle === '') {
			case true:
				showErrorCallout();
				setTimeout(hideErrorCallout, 3500);
				break;
			case false:
				pushEntry(buildEntryObj(entryTitle, entryBody));
				closeEntryForm();
		}
	}

	function buildEntryObj(title, content) {
		return new jrnlObj(title, formatEntryContent(content));
	}

	function formatEntryContent(content) {
		const contentArr = content.split('\n');
		const modBodyArr = [];
		contentArr.forEach(element => modBodyArr.push(formatParagraph(element)))
		const modBodyStr = modBodyArr.join('');
		return modBodyStr;
	}

	function formatParagraph(paragraph) {
		switch (true) {
			case paragraph.includes('\t'):
				return `<p class="entry_content indent">${paragraph.replace(/\t/g, '')}</p>`;
				break;
			case paragraph[0] === '-':
				return `<p class="entry_content indent">${paragraph.replace('-', '')}</p>`;
				break;
			case paragraph === '':
				break;
			default:
				return `<p class="entry_content noIndent">${paragraph}</p>`;
				break;
		}
	}

	function formatTs(ts) {
		const tsDate = new Date(ts);
		const tsYear = tsDate.getFullYear();
		const tsMon = String(tsDate.getMonth() + 1).padStart(2, '0');
		const tsDay = String(tsDate.getDate()).padStart(2, '0');
		const tsHour = String(tsDate.getHours()).padStart(2, '0');
		const tsMin = String(tsDate.getMinutes()).padStart(2, '0');

		return `${tsYear} / ${tsMon} / ${tsDay} @ ${tsHour}:${tsMin}`;
	}

	function classListAppend(elementArr, className) {
		elementArr.forEach(element => element.classList.add(className))
	}

	// Builder-Renderer functions

	function buildEntryForm(event) {

		const editMode = event.target.id.includes('edit');
		const formAction = editMode ? 'Edits' : 'Entry';

		console.log(`Edit mode is: ${editMode}`)

		console.log(editMode);
		console.log(formAction);

		// build entry form container

		const entryForm = document.createElement('div');
		entryForm.id = 'entry_form_container';
	
		// build entry form control stack

		const contStack = document.createElement('div');
		contStack.className = 'control_stack form';
		contStack.id = 'control_stack form';

		// build discard button

		const discardEntryBtn = document.createElement('div');
		discardEntryBtn.className = 'control form';
		discardEntryBtn.id = `discard_${formAction.toLowerCase()}_btn`;
		discardEntryBtn.textContent = `Discard ${formAction}`;
		discardEntryBtn.addEventListener('click', closeEntryForm);
	
		// build publish button

		const publishEntryBtn = document.createElement('div');
		publishEntryBtn.className = 'control form';
		publishEntryBtn.id = `publish_${formAction.toLowerCase()}_btn`;
		publishEntryBtn.textContent = `Publish ${formAction}`;
		switch (editMode) {
			case false:
				console.log('PUBLISH!');
				publishEntryBtn.addEventListener('click', handlePublishReq);
				break;
			case true:
				console.log('You have chosen wisely')
				publishEntryBtn.addEventListener('click', () => {
					const editTitle = document.getElementById('entry_form_title').value;
					const editContent = formatEntryContent(document.getElementById('entry_form_content').value);
					const updArr = [['title', editTitle], ['content', editContent]];
					const entry = event.target.parentElement.parentElement.parentElement;
					entry.querySelector('.entry_title').textContent = editTitle;
					entry.querySelector('.entry_content').innerHTML = editContent;
					pushUpdate(new updateObj(entry.id, updArr));
					closeEntryForm();
					entry.classList.add('highlight')
					setTimeout(() => entry.classList.remove('highlight'), 200);
				});
		}
	
		// build entry input section

		const inputArea = document.createElement('div');
		inputArea.className = 'entry_input';
	
		// build entry title input

		const entryTitle = document.createElement('input');
		entryTitle.type = 'text';
		entryTitle.id = 'entry_form_title';
		entryTitle.placeholder = 'Type your journal title here...';
		entryTitle.autofocus = true;

		// build entry content textarea

		const entryContent = document.createElement('textarea');
		entryContent.id = 'entry_form_content';
		entryContent.placeholder = 'Type your journal entry here...';
		
		// assemble entry form

		inputArea.appendChild(entryTitle);
		inputArea.appendChild(entryContent);
		contStack.appendChild(publishEntryBtn);
		contStack.appendChild(discardEntryBtn);
		entryForm.appendChild(contStack);
		entryForm.appendChild(inputArea);
	
		return entryForm;
	}

	function buildErrorCallout() {
		
		// build error container

		const errCont = document.createElement('div');
		errCont.id = 'error_callout';
		errCont.backgroundImage = 'url(./images/errCallout.png)';

		// build error text container

		const errText = document.createElement('div');
		errText.id = 'error_message';
		errText.textContent = 'Journal entries must have a title. Please enter a title before trying to publish your entry.';

		// assemble error callout

		errCont.appendChild(errText);

		return errCont;
	}

	function renderEntry(entryObj) {
		const entry = new jrnlEntry(entryObj);
		const entryStack = document.getElementById('entry_stack');
		entryStack.insertBefore(entry.render(), entryStack.firstChild);
	}

	// Server interaction functions

	function loadEntries(archStatus = false) {
		fetch('http://localhost:3000/journalEntries')
		.then(res => res.json())
		.then(jrnlData => jrnlData.filter(entry => archStatus === entry.isArch).forEach(entry => renderEntry(entry)))
	}

	function pushEntry(entryObj) {
		fetch('http://localhost:3000/journalEntries', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Accept': 'application/json'
			},
			body:JSON.stringify(entryObj)
		})
		.then(res => res.json())
		.then(jrnlEntry => renderEntry(jrnlEntry))
	}

	function pushUpdate(updateObj) {
		fetch(`http://localhost:3000/journalEntries/${updateObj.id}`, {
			method: 'PATCH',
			headers: {
				'Content-Type': 'application/json',
				'Accept': 'application/json'
			},
			body:JSON.stringify(updateObj)
		})
		.then(res => res.json())
		.then(jrnlEntry => console.log(jrnlEntry))
	}
}