const STORAGE_KEY = 'atlas-desk-state-v1';

const seedState = {
  activeWorkspaceId: 'product-launch',
  workspaces: [
    { id: 'product-launch', name: 'Product Launch', color: '#f4c95d', documents: [
      { id: 'doc-launch', name: 'Launch brief.md', size: '8 KB', chunks: 6, added: 'Today', text: 'Atlas Desk launches on October 14 with a focused document assistant for small product teams. The beta includes workspace isolation, document citations, and validated actions.' },
      { id: 'doc-research', name: 'Customer research.txt', size: '14 KB', chunks: 12, added: 'Yesterday', text: 'Customers say the fastest path to value is asking questions against a small, trusted knowledge base. The top request is a clear source citation on every answer.' }
    ], messages: [{ role: 'assistant', text: 'Welcome back. Ask me anything about the Product Launch workspace and I will cite the source I used.' }], activity: [{ type: 'retrieval', title: 'Workspace indexed', detail: '2 documents · 18 chunks available', time: 'Today' }], tools: 0, questions: 0 },
    { id: 'client-ops', name: 'Client Operations', color: '#e77a62', documents: [{ id: 'doc-ops', name: 'Onboarding playbook.md', size: '11 KB', chunks: 9, added: 'Sep 22', text: 'New clients receive an onboarding call within two business days. The implementation lead owns the kickoff agenda and the first milestone review.' }], messages: [{ role: 'assistant', text: 'Client Operations is ready. I only search this workspace when it is active.' }], activity: [], tools: 0, questions: 0 },
    { id: 'personal-notes', name: 'Personal Notes', color: '#79a99b', documents: [{ id: 'doc-notes', name: 'Reading list.md', size: '4 KB', chunks: 4, added: 'Sep 19', text: 'Books to revisit: The Design of Everyday Things, Working in Public, and Thinking in Systems.' }], messages: [{ role: 'assistant', text: 'This is your private notes workspace. Its documents never enter another workspace response.' }], activity: [], tools: 0, questions: 0 }
  ]
};

const clone = value => JSON.parse(JSON.stringify(value));
let state;
let apiMode = false;
try { state = JSON.parse(localStorage.getItem(STORAGE_KEY)) || clone(seedState); } catch { state = clone(seedState); }
const byId = id => document.getElementById(id);
const activeWorkspace = () => state.workspaces.find(workspace => workspace.id === state.activeWorkspaceId);
const save = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
const escapeHtml = value => String(value).replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[character]));
const formatTime = () => new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

async function syncFromServer() {
  const response = await fetch('/api/bootstrap');
  if (!response.ok) throw new Error('Sign in required');
  const data = await response.json();
  apiMode = true;
  state = { activeWorkspaceId: state?.activeWorkspaceId || data.workspaces[0].id, workspaces: data.workspaces.map(workspace => ({ ...workspace, questions: workspace.messages.filter(message => message.role === 'user').length, messages: workspace.messages.map(message => ({ ...message, text: message.content, time: message.created_at ? new Date(message.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '' })), activity: workspace.activity.map(item => ({ ...item, time: item.created_at ? new Date(item.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '' })), documents: workspace.documents.map(document => ({ ...document, added: document.created_at.slice(0, 10) })) })) };
  if (!state.workspaces.some(workspace => workspace.id === state.activeWorkspaceId)) state.activeWorkspaceId = state.workspaces[0].id;
  byId('loginScreen').classList.add('hidden'); render();
}

async function login(event) {
  event.preventDefault();
  const error = byId('loginError'); error.textContent = '';
  const response = await fetch('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: byId('loginEmail').value, password: byId('loginPassword').value }) });
  if (!response.ok) { error.textContent = 'Invalid email or password.'; return; }
  await syncFromServer();
}

function render() {
  const workspace = activeWorkspace();
  byId('workspaceSelect').innerHTML = state.workspaces.map(item => `<option value="${item.id}" ${item.id === workspace.id ? 'selected' : ''}>${escapeHtml(item.name)}</option>`).join('');
  byId('workspaceDot').style.background = workspace.color;
  byId('workspaceHeading').textContent = workspace.name;
  byId('metricDocuments').textContent = workspace.documents.length;
  byId('metricQuestions').textContent = workspace.questions;
  byId('metricTools').textContent = workspace.tools;
  byId('documentCountBadge').textContent = workspace.documents.length;
  renderMessages(workspace);
  renderRecentDocuments(workspace);
  renderDocumentsTable(workspace);
  renderActivity(workspace);
}

function renderMessages(workspace) {
  byId('chatMessages').innerHTML = workspace.messages.map(message => `<div class="message ${message.role === 'user' ? 'user' : ''}"><div><div class="message-bubble">${escapeHtml(message.text)}${message.citation ? `<br><span class="citation">↳ ${escapeHtml(message.citation)}</span>` : ''}</div><div class="message-label">${message.role === 'user' ? 'YOU' : 'ATLAS'} · ${message.time || ''}</div></div></div>`).join('');
  const container = byId('chatMessages'); container.scrollTop = container.scrollHeight;
}
function renderRecentDocuments(workspace) {
  byId('recentDocuments').innerHTML = workspace.documents.slice(0, 3).map(document => `<div class="document-row"><span class="file-icon">DOC</span><div><strong>${escapeHtml(document.name)}</strong><span>${document.chunks} indexed chunks · ${document.added}</span></div></div>`).join('') || '<div class="empty-state">No documents yet. Add one to start asking questions.</div>';
}
function renderDocumentsTable(workspace) {
  byId('documentsTable').innerHTML = workspace.documents.map(document => `<div class="table-row"><span class="doc-name"><span class="file-icon">DOC</span>${escapeHtml(document.name)}</span><span class="chunks">${document.chunks}</span><span class="date">${document.added}</span><span class="status">Indexed</span></div>`).join('') || '<div class="empty-state">Your workspace is empty.</div>';
}
function renderActivity(workspace) {
  const content = workspace.activity.length ? workspace.activity.map(item => `<div class="activity-item"><i class="activity-dot" style="background:${item.type === 'tool' ? 'var(--coral)' : 'var(--green)'}"></i><div><strong>${escapeHtml(item.title)}</strong><span> · ${escapeHtml(item.detail)}</span></div><time>${escapeHtml(item.time)}</time></div>`).join('') : '<div class="empty-state">No activity in this workspace yet.</div>';
  byId('activityList').innerHTML = content; byId('fullActivityList').innerHTML = content;
}

function addActivity(workspace, type, title, detail) {
  workspace.activity.unshift({ type, title, detail, time: formatTime() });
  workspace.activity = workspace.activity.slice(0, 20);
}

function chunkDocument(text) { return Math.max(1, Math.ceil(text.trim().length / 220)); }
function retrieve(workspace, question) {
  const terms = question.toLowerCase().split(/[^a-z0-9]+/).filter(term => term.length > 2);
  const ranked = workspace.documents.map(document => ({ document, score: terms.reduce((score, term) => score + (document.text.toLowerCase().includes(term) ? 1 : 0), 0) })).filter(result => result.score > 0).sort((a, b) => b.score - a.score);
  return ranked[0];
}
function groundedAnswer(workspace, question) {
  const match = retrieve(workspace, question);
  if (!match) return { text: `I don't know based on the documents in ${workspace.name}. I searched ${workspace.documents.length} workspace document${workspace.documents.length === 1 ? '' : 's'} and found no supporting passage.`, citation: null };
  const excerpt = match.document.text.length > 210 ? `${match.document.text.slice(0, 207)}...` : match.document.text;
  return { text: `I found a relevant passage in this workspace: ${excerpt}`, citation: match.document.name };
}
function parseToolIntent(question) {
  const text = question.toLowerCase();
  if (text.includes('save') && (text.includes('task') || text.includes('todo'))) return { name: 'save_task', args: { title: question.replace(/save (a )?task:?/i, '').trim() || 'Follow up from workspace chat' } };
  if (text.includes('send') && (text.includes('summary') || text.includes('slack') || text.includes('discord'))) return { name: 'send_summary', args: { channel: 'team-updates', summary: question } };
  return null;
}
function validateToolCall(tool) {
  if (!tool || !['save_task', 'send_summary'].includes(tool.name)) return { valid: false, error: 'Unknown tool request.' };
  if (tool.name === 'save_task' && (!tool.args || typeof tool.args.title !== 'string' || !tool.args.title.trim())) return { valid: false, error: 'save_task requires a non-empty title.' };
  if (tool.name === 'send_summary' && (!tool.args || !['team-updates', 'leadership'].includes(tool.args.channel))) return { valid: false, error: 'send_summary requires an approved channel.' };
  return { valid: true };
}
function executeTool(workspace, tool) {
  const check = validateToolCall(tool);
  if (!check.valid) return { success: false, message: `I could not run that action: ${check.error}` };
  workspace.tools += 1;
  addActivity(workspace, 'tool', tool.name === 'save_task' ? 'Task saved' : 'Summary prepared', tool.name === 'save_task' ? tool.args.title : `Ready for #${tool.args.channel}`);
  return { success: true, message: tool.name === 'save_task' ? `Done. I saved “${tool.args.title}” to the ${workspace.name} task list.` : `Done. I prepared a workspace-scoped summary for #${tool.args.channel}. No external webhook was called in local demo mode.` };
}

function askQuestion(event) {
  event.preventDefault(); const input = byId('questionInput'); const question = input.value.trim(); if (!question) return;
  if (apiMode) return askQuestionFromServer(question, input);
  const workspace = activeWorkspace(); workspace.questions += 1; workspace.messages.push({ role: 'user', text: question, time: formatTime() });
  const tool = parseToolIntent(question); let answer;
  if (tool) { const result = executeTool(workspace, tool); answer = { text: result.message }; }
  else { answer = groundedAnswer(workspace, question); addActivity(workspace, 'retrieval', answer.citation ? 'Question answered' : 'No supporting passage', answer.citation ? `Cited ${answer.citation}` : 'Honest knowledge boundary'); }
  workspace.messages.push({ role: 'assistant', text: answer.text, citation: answer.citation, time: formatTime() }); input.value = ''; save(); render();
}
async function askQuestionFromServer(question, input) {
  const workspace = activeWorkspace(); input.value = '';
  const response = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ workspace_id: workspace.id, question }) });
  if (!response.ok) { showToast('The assistant could not process that request.'); return; }
  await syncFromServer();
}
function openUpload() { byId('fileInput').click(); }
function handleFiles(event) {
  if (apiMode) return handleFilesOnServer(event);
  const workspace = activeWorkspace(); Array.from(event.target.files).forEach(file => { const reader = new FileReader(); reader.onload = () => { const text = String(reader.result || ''); workspace.documents.unshift({ id: `doc-${Date.now()}-${Math.random()}`, name: file.name, size: `${Math.max(1, Math.round(file.size / 1024))} KB`, chunks: chunkDocument(text), added: 'Just now', text: text || `Uploaded document: ${file.name}` }); addActivity(workspace, 'retrieval', 'Document indexed', `${file.name} · ${chunkDocument(text)} chunks`); save(); render(); showToast(`${file.name} indexed in ${workspace.name}`); }; reader.readAsText(file); }); event.target.value = ''; }
async function handleFilesOnServer(event) {
  const workspace = activeWorkspace();
  for (const file of Array.from(event.target.files)) {
    const content = await file.text();
    await fetch('/api/upload', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ workspace_id: workspace.id, name: file.name, content }) });
    showToast(`${file.name} indexed in ${workspace.name}`);
  }
  event.target.value = ''; await syncFromServer();
}
function showToast(message) { const toast = byId('toast'); toast.textContent = message; toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 2600); }
function switchView(view) { document.querySelectorAll('.view').forEach(item => item.classList.remove('active-view')); byId(`${view}View`).classList.add('active-view'); document.querySelectorAll('.nav-item').forEach(item => item.classList.toggle('active', item.dataset.view === view)); byId('pageTitle').textContent = view === 'overview' ? 'Good morning, Jordan.' : view === 'documents' ? 'Workspace documents.' : 'A clear record of work.'; }

document.querySelectorAll('.nav-item').forEach(button => button.addEventListener('click', () => switchView(button.dataset.view)));
document.querySelectorAll('[data-view-target]').forEach(button => button.addEventListener('click', () => switchView(button.dataset.viewTarget)));
byId('workspaceSelect').addEventListener('change', event => { state.activeWorkspaceId = apiMode ? Number(event.target.value) : event.target.value; save(); render(); showToast(`Switched to ${activeWorkspace().name}`); });
byId('chatForm').addEventListener('submit', askQuestion);
['uploadHeroButton', 'uploadDocumentsButton', 'uploadDropzone'].forEach(id => byId(id).addEventListener('click', openUpload));
byId('fileInput').addEventListener('change', handleFiles);
byId('loginForm').addEventListener('submit', login);
byId('questionInput').addEventListener('keydown', event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); byId('chatForm').requestSubmit(); } });
syncFromServer().catch(() => { byId('loginScreen').classList.remove('hidden'); });
