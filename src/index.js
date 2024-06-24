document.addEventListener('DOMContentLoaded', main);

function main() {

	// page view modes and filter functions

	const viewMode = {
		active: (entry) => !entry.isArch,
		archive: (entry) => entry.isArch,
		accent: (entry) => entry.isAccent
	}

	// load all entries

	const jrnlDataPath = 'http://localhost:3000/journalEntries';

	loadEntries(viewMode.active);

	// object classes

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
			this.archBtn.title = !entryObj.isArch ? 'Archive this entry' : 'Restore this entry';
			this.archBtn.addEventListener('click', () => {
				const updArr = [['isArch', !entryObj.isArch]];
				if (!entryObj.isArch) updArr.push(['isAccent', false]);
				pushUpdate(new updateObj(this.entry.id, updArr));
				const targetNode = document.getElementById(this.entry.id);
				if (!entryObj.isArch) {
					targetNode.classList.add('remove');
				} else {
					targetNode.classList.replace('archived', 'restore');
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
				openEntryForm(event, this.entry.id);
				const titleField = document.getElementById('entry_form_title');
				const contentField = document.getElementById('entry_form_content');
				const content = document.getElementById(this.entry.id).querySelector('.entry_content').innerText;
				titleField.value = entryObj.title;
				contentField.value = content;
				contentField.focus();
			});

			// build accent button

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

	class jrnlEntryForm {
		constructor(event, entryId) {

			// define the form action and product

			const newEntry = !event.target.id.includes('edit')
			const formAction = newEntry ? 'create' : 'edit';
			const formProduct = newEntry ? 'entry' : 'changes';

			// build entry form container

			this.entryForm = document.createElement('div');
			this.entryForm.id = 'entry_form_container';
		
			// build entry form control stack

			this.contStack = document.createElement('div');
			this.contStack.className = 'control_stack form';
			this.contStack.id = 'control_stack form';

			// build discard button

			this.discardEntryBtn = document.createElement('div');
			this.discardEntryBtn.className = 'control form';
			this.discardEntryBtn.id = `form_discard_btn`;
			this.discardEntryBtn.title = `Discard ${formProduct}`;
			this.discardEntryBtn.addEventListener('click', closeEntryForm);
		
			// build publish button

			this.publishEntryBtn = document.createElement('div');
			this.publishEntryBtn.id = 'form_publish_btn'
			this.publishEntryBtn.className = 'control form';
			this.publishEntryBtn.title = `Publish ${formProduct}`;
			switch (formAction) {
				case 'create':
					this.publishEntryBtn.addEventListener('click', handlePublishReq);
					break;
				case 'edit':
					this.publishEntryBtn.addEventListener('click', () => handlePublishEditReq(entryId));
			}

			// build entry input section

			this.inputContainer = document.createElement('div');
			this.inputContainer.className = 'entry_input';
		
			// build entry title input

			this.entryTitle = document.createElement('input');
			this.entryTitle.type = 'text';
			this.entryTitle.id = 'entry_form_title';
			this.entryTitle.placeholder = 'Type your journal title here...';

			// build entry content textarea

			this.entryContent = document.createElement('textarea');
			this.entryContent.id = 'entry_form_content';
			this.entryContent.placeholder = 'Type your journal entry here...';
			
			// assemble entry form

			this.inputContainer.appendChild(this.entryTitle);
			this.inputContainer.appendChild(this.entryContent);
			this.contStack.appendChild(this.publishEntryBtn);
			this.contStack.appendChild(this.discardEntryBtn);
			this.entryForm.appendChild(this.contStack);
			this.entryForm.appendChild(this.inputContainer);

			// add form event listeners

			this.entryForm.addEventListener('keydown', event => {
				switch (true) {
					case event.ctrlKey && event.key === 'Enter' && newEntry:
						handlePublishReq();
						break;
					case event.ctrlKey && event.key === 'Enter' && !newEntry:
						handlePublishEditReq(entryId);
						break;
					default:
						break;
				}
			})
		}
		render() {
			return this.entryForm;
		}
	}

	// static event listeners

	const newEntryBtn = document.getElementById('new_entry_btn');
	const showArchivedBtn = document.getElementById('view_archived_btn');
	const showAccentedBtn = document.getElementById('view_accented_btn');

	newEntryBtn.addEventListener('click', event => {
		openEntryForm(event);
		const titleField = document.getElementById('entry_form_title');
		titleField.focus();
	});
	showArchivedBtn.addEventListener('click', event => handleJrnlFilter(event));
	showAccentedBtn.addEventListener('click', event => handleJrnlFilter(event));

	// administrative functions

	function handleJrnlFilter(event) {
		const control = event.target;
		const controlStack = event.target.parentNode;
		const entryStack = document.getElementById('entry_stack');
		entryStack.innerHTML = '';
		loadEntries(chooseFilter(control));
		updateButtonStatus(controlStack, control);
	}

	function chooseFilter(element) {
		switch (true) {
		case element.classList.contains('active'):
			return viewMode.active;
			break;
		case element.id.includes('archive'):
			return viewMode.archive;
			break;
		case element.id.includes('accent'):
			return viewMode.accent;
			break;
		}
	}

	function updateButtonStatus(parentElement, targetElement) {
		if (targetElement.classList.contains('active')) {
			targetElement.classList.remove('active');
		} else {
			for (const child of parentElement.children) {
				if (child.classList.contains('active')) child.classList.remove('active');
				targetElement.classList.add('active');
			}
		}
	}

	function openEntryForm(event, entryId = null) {
		document.getElementById('page_header').classList.add('blur');
		document.getElementById('page_content').classList.add('blur');
		const entryForm = new jrnlEntryForm(event, entryId).render();
		document.body.appendChild(entryForm);
		document.addEventListener('keydown', event => handleEscKey(event));
		setTimeout(() => entryForm.style.opacity = 1, 50);
	}

	function handleEscKey(event) {
		if (event.key == 'Escape') closeEntryForm();
	}

	function closeEntryForm() {
		const formCont = document.getElementById('entry_form_container');
		formCont.style.opacity = 0;
		document.getElementById('page_header').classList.remove('blur');
		document.getElementById('page_content').classList.remove('blur');
		document.removeEventListener('keydown', event => handleEscKey(event));
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
				pushEntry(new jrnlObj(entryTitle, formatEntryContent(entryBody)));
				closeEntryForm();
		}
	}

	function handlePublishEditReq(entryId) {
		const editTitle = document.getElementById('entry_form_title').value;
		const editContent = formatEntryContent(document.getElementById('entry_form_content').value);
		const updArr = [['title', editTitle], ['content', editContent]];
		pushUpdate(new updateObj(entryId, updArr));
		const entry = document.getElementById(entryId);
		entry.querySelector('.entry_title').textContent = editTitle;
		entry.querySelector('.entry_content').innerHTML = editContent;
		closeEntryForm();
		entry.classList.add('highlight')
		setTimeout(() => entry.classList.remove('highlight'), 200);
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

	// builder-renderer functions

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
		const entry = new jrnlEntry(entryObj).render();
		const entryStack = document.getElementById('entry_stack');
		entryStack.insertBefore(entry, entryStack.firstChild);
	}

	// Server interaction functions

	function loadEntries(filterFunction = viewMode.active) {
		fetch(jrnlDataPath)
		.then(res => res.json())
		.then(jrnlData => jrnlData.filter(filterFunction).forEach(entry => renderEntry(entry)))
	}

	function pushEntry(entryObj) {
		fetch(jrnlDataPath, {
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
		fetch(`${jrnlDataPath}/${updateObj.id}`, {
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