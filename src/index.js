// SERVER PATH

const serverPath = 'http://localhost:3000/journalEntries';

// CALLLBACK FUNCTIONS

const viewActive = entry => !entry.isArch;
const viewArchived = entry => entry.isArch;
const viewAccented = entry => entry.isAccent;
const handleEscKey = event => event.key === 'Escape' && closeEntryForm();
const activeClass = child => child.classList.contains('active');
const toggleBlur = element => element.classList.toggle('blur');
const toggleOpacity = element => element.style.opacity = Math.abs(element.style.opacity - 1);
const removeElement = element => element.remove();

// ADMINISTRATIVE FUNCTIONS

// click listener

function activateListeners() {
	document.addEventListener('click', event => {
		if (event.target.matches('#new_entry_btn')) {
			openEntryForm(event);
			const titleField = document.getElementById('entry_form_title');
			titleField.focus();
		} else if (event.target.matches('#view_archived_btn') || event.target.matches('#view_accented_btn')) {
			handleJrnlFilter(event);
		};
	});
};

// populating and filtering the entry stack

function renderEntry(entryObj) {
	const entry = new JrnlEntry(entryObj).render();
	const entryStack = document.getElementById('entry_stack');
	entryStack.insertBefore(entry, entryStack.firstChild);
};

const newDate = () => new Date();

function chooseFilter(element) {
	if (element.classList.contains('active')) {
		return viewActive;
	} else if (element.id.includes('archive')) {
		return viewArchived;
	} else if (element.id.includes('accent')) {
		return viewAccented;
	};
};

function handleJrnlFilter(event) {
	const control = event.target;
	const controlStack = event.target.parentNode;
	const entryStack = document.getElementById('entry_stack');
	entryStack.innerHTML = '';
	loadEntries(chooseFilter(control));
	updateBtnStatus(controlStack, control);
};

function updateBtnStatus(parentElement, targetElement) {
	const children = Array.from(parentElement);
	const activeElement = children.find(activeClass);
	if (activeElement && activeElement !== targetElement) {
		activeElement.classList.remove('active');
	};
	targetElement.classList.toggle('active');
};

// entry form mechanics

function toggleBgBlur() {
	const blurNodes = document.querySelectorAll('.filter_node');
	blurNodes.forEach(toggleBlur);
};

function openEntryForm(event, entryId = null) {
	toggleBgBlur();
	const form = new JrnlEntryForm(event, entryId).render();
	document.body.append(form);
	document.addEventListener('keydown', handleEscKey);
	setTimeout(() => toggleOpacity(form), 50);
};

function closeEntryForm() {
	const form = document.getElementById('entry_form_container');
	toggleOpacity(form);
	toggleBgBlur();
	document.removeEventListener('keydown', handleEscKey);
	setTimeout(() => removeElement(form), 500);
};

function showError() {
	const contStack = document.getElementById('entry_form_container');
	const error = new ErrorCallout();
	contStack.append(error.render());
	const errCallout = document.getElementById('error_callout');
	setTimeout(() => toggleOpacity(errCallout), 50);
};

function removeError() {
	const errCallout = document.getElementById('error_callout');
	toggleOpacity(errCallout);
	setTimeout(() => removeElement(errCallout), 500);
};

// entry form publishing

function handlePublishReq() {
	const title = document.getElementById('entry_form_title').value;
	const content = document.getElementById('entry_form_content').value;
	switch (title === '') {
		case true:
			showError();
			setTimeout(removeError, 3500);
			break;
		case false:
			const entry = new JrnlObj(title, formatContent(content));
			pushEntry(entry);
			closeEntryForm();
			break;
	};
};

function handlePublishEditReq(entryId) {
	const title = document.getElementById('entry_form_title').value;
	const content = formatContent(document.getElementById('entry_form_content').value);
	const updArr = [['id', entryId], ['title', title], ['content', content]];
	const update = new JrnlUpdate(updArr);
	pushUpdate(update);
	const entry = document.getElementById(entryId);
	entry.querySelector('.entry_title').textContent = title;
	entry.querySelector('.entry_content').innerHTML = content;
	closeEntryForm();
	entry.classList.add('highlight')
	setTimeout(() => entry.classList.remove('highlight'), 200);
};

// text formatting

function formatContent(content) {
	const contentArr = content.split('\n');
	const modBodyArr = [];
	contentArr.forEach(element => modBodyArr.push(formatParagraph(element)))
	const modBodyStr = modBodyArr.join('');

	return modBodyStr;
};

function formatParagraph(paragraph) {
	switch (true) {
		case paragraph.includes('\t'):
			return `<p class="entry_content indent">${paragraph.replace(/\t/g, '')}</p>`;
		case paragraph[0] === '-':
			return `<p class="entry_content indent">${paragraph.replace('-', '')}</p>`;
		case paragraph === '':
			break;
		default:
			return `<p class="entry_content noIndent">${paragraph}</p>`;
	};
};

function formatTs(ts) {
	const tsDate = new Date(ts);
	const tsYear = tsDate.getFullYear();
	const tsMon = String(tsDate.getMonth() + 1).padStart(2, '0');
	const tsDay = String(tsDate.getDate()).padStart(2, '0');
	const tsHour = String(tsDate.getHours()).padStart(2, '0');
	const tsMin = String(tsDate.getMinutes()).padStart(2, '0');

	return `${tsYear} / ${tsMon} / ${tsDay} @ ${tsHour}:${tsMin}`;
};

// class list manipulation

function classListAppend(elementArr, className) {
	elementArr.forEach(element => element.classList.add(className))
};

// SERVER INTERACTION FUNCTIONS

function loadEntries(filterFunction = viewActive) {
	fetch(serverPath)
	.then(res => {
		if (!res.ok) throw new Error(`We got issues: ${res.responseText}`);
		return res.json();
	})
	.then(jrnlData => jrnlData.filter(filterFunction).forEach(entry => renderEntry(entry)))
	.catch(error => console.error(`We got issues: ${error}`))
};

function pushEntry(entryObj) {
	fetch(serverPath, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Accept': 'application/json'
		},
		body: JSON.stringify(entryObj)
	})
	.then(res => {
		if (!res.ok) throw new Error(`We got issues: ${res.responseText}`);
		return res.json();
	})
	.then(jrnlEntry => renderEntry(jrnlEntry))
	.catch(error => console.error(`We got issues: ${error}`))
};

function pushUpdate(updateObj) {
	fetch(`${serverPath}/${updateObj.id}`, {
		method: 'PATCH',
		headers: {
			'Content-Type': 'application/json',
			'Accept': 'application/json'
		},
		body: JSON.stringify(updateObj)
	})
	.then(res => {
		if (!res.ok) throw new Error(`We got issues: ${res.responseText}`);
		return res.json();
	})
	.then(jrnlEntry => console.log(jrnlEntry))
	.catch(error => console.error(`We got issues: ${error}`))
};

// CLASSES

class JrnlObj {
	constructor(title, content) {
		this.title = title;
		this.content = content;
		this.pubTs = newDate();
		this.isAccent = false;
		this.isArch = false;
		this.updLog = {};
	};
};

class JrnlUpdate {
	constructor(updArr) {
		updArr.forEach(element => this[element[0]] = element[1]);
		this.lupdTs = newDate();
	};
};

class JrnlEntry {
	constructor({id, title, content, pubTs, isAccent, isArch}) {

		// build entry container

		this.entry = document.createElement('div');
		this.entry.id = id;
		this.entry.className = `entry`;
		if (isAccent) this.entry.classList.add('accent');
		if (isArch) this.entry.classList.add('archived');

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
		this.title.innerText = title;

		this.pubTs = document.createElement('p');
		this.pubTs.className = `entry_publish_ts`;
		this.pubTs.innerText = formatTs(pubTs);

		// build buttons

		this.archBtn = this.createActionButton('entry_archive_btn', id, !isArch ? 'Archive this entry' : 'Restore this entry', () => {
			const updArr = [['id', id], ['isArch', !isArch]];
			if (!isArch) updArr.push(['isAccent', false]);
			const archUpdate = new JrnlUpdate(updArr);
			pushUpdate(archUpdate);
			const thisEntry = document.getElementById(this.entry.id);
			if (!isArch) {
				thisEntry.classList.add('remove');
			} else {
				thisEntry.classList.replace('archived', 'restore');
			}
			setTimeout(() => toggleOpacity(thisEntry), 100);
			setTimeout(() => removeElement(thisEntry), 300);
		});

		this.editBtn = this.createActionButton('entry_edit_btn', id, 'Edit this entry', event => {
			openEntryForm(event, this.entry.id);
			const titleField = document.getElementById('entry_form_title');
			const contentField = document.getElementById('entry_form_content');
			const content = document.getElementById(this.entry.id).querySelector('.entry_content').innerText;
			titleField.value = title;
			contentField.value = content;
			contentField.focus();
		});

		this.accentBtn = this.createActionButton('entry_star_btn', id, !isAccent ? 'Accent this entry' : 'Remove accent from entry', () => {
			const updArr = [['id', id], ['isAccent', !isAccent]];
			const accUpdate = new JrnlUpdate(updArr);
			pushUpdate(accUpdate);
			const targetNode = document.getElementById(this.entry.id);
			isAccent ? targetNode.classList.remove('accent') : targetNode.classList.add('accent');
			isAccent = !isAccent;
			this.accentBtn.title = !isAccent ? 'Accent this entry' : 'Remove accent from entry';
		});

		// build entry content element

		this.content = document.createElement('div');
		this.content.className = `entry_content`;
		this.content.innerHTML = content;

		// assemble entry

		this.headText.append(this.title);
		this.headText.append(this.pubTs);
		this.headActions.append(this.archBtn);
		this.headActions.append(this.editBtn);
		this.headActions.append(this.accentBtn);
		this.head.append(this.headText);
		this.head.append(this.headActions);
		this.entry.append(this.head);
		this.entry.append(this.content);
	};

	createActionButton(className, id, title, action) {
		const btn = document.createElement('div');
		btn.id = `${className}_${id}`;
		btn.className = className;
		btn.classList.add(className, 'entry_action_btn')
		btn.title = title;
		btn.addEventListener('click', action);
		return btn;
	};

	render() {
		return this.entry;
	};
};

class JrnlEntryForm {
	constructor(event, entryId) {

		// define the form action and product

		const newEntry = !event.target.id.includes('edit');
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
		this.discardEntryBtn.title = `Discard ${formProduct} ( <esc> )`;
		this.discardEntryBtn.addEventListener('click', closeEntryForm);
	
		// build publish button

		this.publishEntryBtn = document.createElement('div');
		this.publishEntryBtn.id = 'form_publish_btn'
		this.publishEntryBtn.className = 'control form';
		this.publishEntryBtn.title = `Publish ${formProduct} ( <ctrl> + <enter> )`;
		switch (formAction) {
			case 'create':
				this.publishEntryBtn.addEventListener('click', handlePublishReq);
				break;
			case 'edit':
				this.publishEntryBtn.addEventListener('click', () => handlePublishEditReq(entryId));
		};

		// build entry input section

		this.inputContainer = document.createElement('div');
		this.inputContainer.className = 'entry_input';
	
		// build entry title input

		this.entryTitle = document.createElement('input');
		this.entryTitle.type = 'text';
		this.entryTitle.id = 'entry_form_title';
		this.entryTitle.placeholder = 'Type journal title here...';

		// build entry content textarea

		this.entryContent = document.createElement('textarea');
		this.entryContent.id = 'entry_form_content';
		this.entryContent.placeholder = 'Type journal entry here...';
		
		// assemble entry form

		this.inputContainer.append(this.entryTitle);
		this.inputContainer.append(this.entryContent);
		this.contStack.append(this.publishEntryBtn);
		this.contStack.append(this.discardEntryBtn);
		this.entryForm.append(this.contStack);
		this.entryForm.append(this.inputContainer);

		// add form event listeners

		this.entryForm.addEventListener('keydown', event => {
			switch (true) {
				case event.ctrlKey && event.key === 'Enter' && newEntry:
					handlePublishReq();
					break;
				case event.ctrlKey && event.key === 'Enter' && !newEntry:
					handlePublishEditReq(entryId);
					break;
			};
		});
	};
	render() {
		return this.entryForm;
	};
};

class ErrorCallout {
	constructor() {

		// build error container

		this.error = document.createElement('div');
		this.error.id = 'error_callout';
		this.error.backgroundImage = 'url(./images/errCallout.png)';

		// build error text container

		this.text = document.createElement('div');
		this.text.id = 'error_message';
		this.text.textContent = 'Journal entries must have a title. Please enter a title before trying to publish your entry.';
	
		// assemble error

		this.error.append(this.text);
	};

	render() {
		return this.error;
	};
};

// INITIALIZATION FUNCTION AND DOM CONTENT LISTENER

function main() {
	loadEntries(viewActive);
	activateListeners();
};

document.addEventListener('DOMContentLoaded', main);