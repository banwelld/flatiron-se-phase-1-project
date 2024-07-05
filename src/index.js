/*
Dave Banwell Phase One Project

REQUIRED CODE ELEMENT LOCATIONS:

Server interactions:
line 24: Server path variable assigned
Line 196 - 239: fetch request functions
All journal entries persist to the db.json file via post/patch requests

Event listeners:
line 42, 329, 469: click listeners
line 102, 441: key listener
line 519: DOM content listener

Array iteration methods:
line 95, 169, 191, 203, 256: .forEach
line 83: .find
line 199: .filter
*/

// SERVER PATH

const serverPath = 'http://localhost:3000/journalEntries';

// CALLLBACK FUNCTIONS

const viewActive = entry => !entry.isArchived;
const viewArchived = entry => entry.isArchived;
const viewAccented = entry => entry.isAccented;
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
	const controlStack = event.target.parentElement;
	const entryStack = document.getElementById('entry_stack');
	entryStack.innerHTML = '';
	loadEntries(chooseFilter(control));
	updateScreenElements(controlStack, control);
};

function updateScreenElements(parentElement, targetElement) {
	const children = Array.from(parentElement.children);
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
	const title = document.getElementById('entry_form_title').textContent;
	const content = document.getElementById('entry_form_content').textContent;
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
	const title = document.getElementById('entry_form_title').textContent;
	const content = formatContent(document.getElementById('entry_form_content').innerText);
	const updArr = [
		['id', entryId], 
		['title', title], 
		['content', content]
	];
	const update = new JrnlUpdate(updArr);
	pushUpdate(update);
	const entry = document.getElementById(entryId);
	entry.querySelector('.entry_text_title').innerText = title;
	entry.querySelector('.entry_content').innerHTML = content;
	closeEntryForm();
	entry.classList.add('highlight');
	setTimeout(() => entry.classList.remove('highlight'), 200);
};

// text formatting

function formatContent(content) {
	const contentArr = content.split('\n');
	const modBodyArr = [];
	contentArr.forEach(element => modBodyArr.push(formatParagraph(element)));
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

// class list manipulation

function classListAppend(elementArr, className) {
	elementArr.forEach(element => element.classList.add(className));
};

// SERVER INTERACTION FUNCTIONS

function loadEntries(viewFilter = viewActive) {
	fetch(serverPath)
	.then(res => {
		if (!res.ok) throw new Error(`We got issues: ${res.responseText}`);
		return res.json();
	})
	.then(jrnlData => jrnlData.filter(viewFilter))
	.then(jrnlData => jrnlData.forEach(entry => renderEntry(entry)))
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
		this.isAccented = false;
		this.isArchived = false;
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
	constructor({id, title, content, pubTs, isAccented, isArchived}) {

		// set object properties
		this.id = id;
		this.elTitle = title;
		this.elContent = content;
		this.timestamp = pubTs;
		this.isAccented = isAccented;
		this.isArchived = isArchived;

		// structure for the entry element
		this.blueprint = {
			entry: {tag: 'div', parent: 'none'},
			head: {tag: 'div', parent: 'entry'},
			text: {tag: 'div', parent: 'head'},
			title: {tag: 'h2', parent: 'text'},
			pubTs: {tag: 'p', parent: 'text'},
			actions: {tag: 'div', parent: 'head'},
			archiveBtn: {tag: 'div', parent: 'actions'},
			editBtn: {tag: 'div', parent: 'actions'},
			accentBtn: {tag: 'div', parent: 'actions'},
			content: {tag: 'div', parent: 'entry'}
		};

		// create elements and assign ids and classes
		this.createAllElements();
	};

	createAllElements() {
		for (const key in this.blueprint) {
			this.key = key;
			const {tag, parent} = this.blueprint[key];

			this[key] = document.createElement(tag);
			
			if (key === 'entry') {
				this.buildEntryContainer();
			} else if (key.includes('Btn')) {
				this.buildActionBtn();
				this[parent].append(this[key]);
			} else {
				this[key].classList.add(parent === 'entry' ? `${parent}_${key}` : `entry_${parent}_${key}`);
				if (key === 'title') this[key].innerText = this.elTitle;
				if (key === 'pubTs') this[key].innerText = this.formatTs();
				if (key === 'content') this[key].innerHTML = this.elContent;
				this[parent].append(this[key]);
			};
		};
	};

	// special cases
	buildEntryContainer() {
		const entry = this[this.key];
		entry.id = this.id;
		entry.classList.add('entry', this.id);
		if (this.isAccented) entry.classList.add('accent');
		if (this.isArchived) entry.classList.add('archived');
	}

	buildActionBtn() {
		const btn = this[this.key];
		const action = this.key.substring(0, this.key.length - 3);
		const frmtAction = action.charAt(0).toUpperCase() + action.slice(1);

		btn.id = `entry_${action}_btn_${this.id}`;
		btn.classList.add(`entry_${action}_btn`, 'entry_action_btn');
		btn.title = action === 'archive' ? `Archive/restore this entry` : `${frmtAction} this entry`;
		btn.addEventListener('click', (event) => this.callbackSelector(action, event));
	};

	callbackSelector(action, event) {
		if (action === 'archive') {
			return this.archiveBtnCallback();
		} else if (action === 'accent') {
			return this.accentBtnCallback();
		} else if (action === 'edit') {
			return this.editBtnCallback(event);
		};
	};

	// button callback functions
	archiveBtnCallback() {
		const updArr = [
			['id', this.id], 
			['isArchived', !this.isArchived]
		];
		
		if (!this.isArchived) updArr.push(['isAccented', false]);
		
		const archUpdate = new JrnlUpdate(updArr);
		pushUpdate(archUpdate);
		
		if (!this.isArchived) {
			this.entry.classList.add('remove');
		} else {
			this.entry.classList.replace('archived', 'restore');
		};

		setTimeout(() => toggleOpacity(this.entry), 100);
		setTimeout(() => removeElement(this.entry), 300);
	};

	editBtnCallback(event) {
		openEntryForm(event, this.id);
		const titleField = document.getElementById('entry_form_title');
		const contentField = document.getElementById('entry_form_content');
		const entryText = this.entry.querySelector('.entry_content').innerText;
		
		titleField.textContent = this.elTitle;
		contentField.innerText = entryText;
		
		contentField.focus();
	};

	accentBtnCallback() {
		const updArr = [
			['id', this.id],
			['isAccented', !this.isAccented]
		];

		const accUpdate = new JrnlUpdate(updArr);
		pushUpdate(accUpdate);
		
		const targetNode = document.getElementById(this.id);
		this.isAccented ? targetNode.classList.remove('accent') : targetNode.classList.add('accent');
		this.isAccented = !this.isAccented;
		this[this.key].title = !this.isAccented ? 'Accent this entry' : 'Remove accent from entry';
	};

	// timestamp formatting
	formatTs() {
		const tsDate = new Date(this.timestamp);
		const tsYear = tsDate.getFullYear();
		const tsMon = String(tsDate.getMonth() + 1).padStart(2, '0');
		const tsDay = String(tsDate.getDate()).padStart(2, '0');
		const tsHour = String(tsDate.getHours()).padStart(2, '0');
		const tsMin = String(tsDate.getMinutes()).padStart(2, '0');
		return `${tsYear} / ${tsMon} / ${tsDay} @ ${tsHour}:${tsMin}`;
	};

	render() {
		return this.entry;
	};
};


class JrnlEntryForm {
	constructor(event, entryId) {

		// Set object properties
		this.id = entryId;
		this.newEntry = !event.target.id.includes('edit');
		this.formAction = this.newEntry ? 'create' : 'edit';
		this.formProduct = this.newEntry ? 'entry' : 'changes';

		// Structure for the builder function
		this.blueprint = {
			entry_form: { parent: 'none' },
			control_stack: { parent: 'entry_form' },
			input: { parent: 'entry_form' },
			discardBtn: { parent: 'control_stack' },
			publishBtn: { parent: 'control_stack' },
			title: { parent: 'input' },
			content: { parent: 'input' }
		};

		// Create elements and assign IDs and classes
		this.createAllElements();
	}

	createAllElements() {
		for (const key in this.blueprint) {
			const parent = this.blueprint[key].parent;
			this.key = key;

			this[key] = document.createElement('div');

			if (key === 'entry_form') {
				this[key].id = `${key}_container`;
				this[key].addEventListener('keydown', event => {
					if (event.ctrlKey && event.key === 'Enter' && this.newEntry) handlePublishReq();
					if (event.ctrlKey && event.key === 'Enter' && !this.newEntry) handlePublishEditReq(this.id);
				});
			} else if (key.includes('Btn')) {
				this.buildActionBtn();
				this[parent].append(this[key]);
			} else {
				this[key].className = key === 'control_stack' ? 'control_stack form' : `entry_form_${key}`;
				if (key === 'control_stack') this[key].id = key;
				if (parent === 'input') {
					this[key].contentEditable = true;
					this[key].id = `entry_form_${key}`;
				};
				this[parent].append(this[key]);
			};
		};
	};

	// Build action buttons
	buildActionBtn() {
		const btn = this[this.key];
		const btnAction = this.key.substring(0, this.key.length - 3);
		const frmtAction = btnAction.charAt(0).toUpperCase() + btnAction.slice(1);

		btn.className = 'control form';
		btn.id = `form_${btnAction}_btn`;
		btn.title = `${frmtAction} ${this.formProduct} (${btnAction === 'discard' ? '<esc>' : '<ctrl> + <enter>'})`;
		btn.addEventListener('click', this.callbackSelector(btnAction));
	};

	callbackSelector(btnAction) {
		if (btnAction === 'discard') {
			return closeEntryForm;
		} else if (btnAction === 'publish') {
			return this.formAction === 'create' ? handlePublishReq : () => handlePublishEditReq(this.id);
		};
	};

	render() {
		return this.entry_form;
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