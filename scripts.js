const SUPABASE_URL = 'https://whbsxgkylhvzvixvqbbf.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_7L7wBYRyZ9EJbvurMZPZPw_JbM0B4-M';
const WRITING_BUCKET = 'writing-files';
const SONG_ROW_ID = 1;

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

let writingEntries = [];
let reviewEntries = [];
let writingComments = [];
let currentUser = null;

function openTab(tabName) {
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(content => content.classList.remove('active'));

    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => button.classList.remove('active'));

    const selectedTab = document.getElementById(tabName);
    if (selectedTab) {
        selectedTab.classList.add('active');
    }

    const clickedButton = window.event && window.event.target;
    if (clickedButton && clickedButton.classList.contains('tab-button')) {
        clickedButton.classList.add('active');
    }
}

function buildTextPreview(text, paragraphLimit = 2) {
    if (!text) return '';

    const paragraphs = text
        .split(/\n\s*\n/)
        .map(paragraph => paragraph.trim())
        .filter(Boolean);

    if (!paragraphs.length) {
        return text.trim();
    }

    return paragraphs.slice(0, paragraphLimit).join('\n\n');
}

function escapeHtml(text) {
    const replacements = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    };

    return String(text).replace(/[&<>"']/g, character => replacements[character]);
}

function convertPlainTextToHtml(text) {
    const paragraphs = text
        .split(/\n\s*\n/)
        .map(paragraph => paragraph.trim())
        .filter(Boolean);

    if (!paragraphs.length) {
        return '<p></p>';
    }

    return paragraphs
        .map(paragraph => `<p>${escapeHtml(paragraph).replace(/\n/g, '<br>')}</p>`)
        .join('\n');
}

function sanitizeFileName(fileName) {
    return fileName.replace(/[^a-zA-Z0-9._-]/g, '-');
}

function extractTrackId(value) {
    const trimmed = value.trim();
    const match = trimmed.match(/track\/([a-zA-Z0-9]+)/);
    return match ? match[1] : trimmed;
}

function isAdminMode() {
    return Boolean(currentUser);
}

function setAuthMessage(message, type = '') {
    const messageElement = document.getElementById('auth-message');
    if (!messageElement) return;

    messageElement.textContent = message;
    messageElement.className = 'auth-message';
    if (type) {
        messageElement.classList.add(type);
    }
}

function openAuthModal() {
    const modal = document.getElementById('auth-modal');
    if (!modal) return;

    modal.hidden = false;
    setAuthMessage('');

    const emailInput = document.getElementById('auth-email');
    if (emailInput) {
        emailInput.focus();
    }
}

function closeAuthModal() {
    const modal = document.getElementById('auth-modal');
    if (!modal) return;

    modal.hidden = true;
    setAuthMessage('');

    const form = document.getElementById('auth-form');
    if (form) {
        form.reset();
    }
}

function updateAdminUI() {
    document.querySelectorAll('.upload-form').forEach(form => {
        form.style.display = isAdminMode() ? 'block' : 'none';
    });
    document.querySelectorAll('.review-form').forEach(form => {
        form.style.display = isAdminMode() ? 'grid' : 'none';
    });
    document.querySelectorAll('.song-form').forEach(form => {
        form.style.display = isAdminMode() ? 'block' : 'none';
    });

    const adminToggle = document.getElementById('admin-toggle');
    if (adminToggle) {
        adminToggle.textContent = isAdminMode() ? 'Log Out Admin' : 'Admin Sign In';
    }
}

function renderEmptyState(container, message) {
    const emptyMessage = document.createElement('p');
    emptyMessage.className = 'empty-state';
    emptyMessage.textContent = message;
    container.appendChild(emptyMessage);
}

function createExpandableText(previewText, options = {}) {
    const { fullText = '', html = '' } = options;
    const previewContainer = document.createElement('div');
    previewContainer.className = 'text-preview-container';

    const previewDiv = document.createElement('div');
    previewDiv.className = 'text-preview collapsed';
    const previewParagraph = document.createElement('p');
    previewParagraph.className = 'upload-preview';
    previewParagraph.textContent = previewText;
    previewDiv.appendChild(previewParagraph);
    previewContainer.appendChild(previewDiv);

    const fullDiv = document.createElement('div');
    fullDiv.className = 'text-full';
    fullDiv.style.display = 'none';

    if (html) {
        fullDiv.innerHTML = html;
    } else {
        const fullParagraph = document.createElement('p');
        fullParagraph.className = 'upload-preview';
        fullParagraph.textContent = fullText;
        fullDiv.appendChild(fullParagraph);
    }

    previewContainer.appendChild(fullDiv);

    const expandBtn = document.createElement('button');
    expandBtn.type = 'button';
    expandBtn.className = 'expand-text-btn';
    expandBtn.textContent = '▼ Show More';
    expandBtn.addEventListener('click', () => {
        const isExpanded = fullDiv.style.display !== 'none';
        fullDiv.style.display = isExpanded ? 'none' : 'block';
        previewDiv.classList.toggle('collapsed', isExpanded);
        expandBtn.textContent = isExpanded ? '▼ Show More' : '▲ Show Less';
    });

    previewContainer.appendChild(expandBtn);
    return previewContainer;
}

function appendAdminActions(item, tab, upload) {
    if (!isAdminMode()) return;

    const actions = document.createElement('div');
    actions.className = 'admin-actions';

    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'edit-btn';
    editBtn.textContent = 'Edit';
    editBtn.addEventListener('click', () => openEditModal(tab, upload));
    actions.appendChild(editBtn);

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'delete-btn';
    deleteBtn.textContent = tab === 'reviews' ? 'Delete Review' : 'Delete Entry';
    deleteBtn.addEventListener('click', () => deleteUpload(tab, upload));
    actions.appendChild(deleteBtn);

    item.appendChild(actions);
}

function buildCommentTree(comments) {
    const childrenByParent = new Map();

    comments.forEach(comment => {
        const parentKey = comment.parent_id || 'root';
        if (!childrenByParent.has(parentKey)) {
            childrenByParent.set(parentKey, []);
        }
        childrenByParent.get(parentKey).push(comment);
    });

    function attachReplies(parentId) {
        const key = parentId || 'root';
        const children = childrenByParent.get(key) || [];
        return children.map(comment => ({
            ...comment,
            replies: attachReplies(comment.id)
        }));
    }

    return attachReplies(null);
}

function displayComments(container, comments, writingEntryId) {
    comments.forEach(comment => {
        const commentDiv = document.createElement('div');
        commentDiv.className = 'comment';
        commentDiv.setAttribute('data-comment-id', comment.id);

        const text = document.createElement('p');
        text.textContent = comment.text;
        commentDiv.appendChild(text);

        const timestamp = document.createElement('small');
        timestamp.textContent = new Date(comment.created_at).toLocaleString();
        commentDiv.appendChild(timestamp);

        const replyBtn = document.createElement('button');
        replyBtn.type = 'button';
        replyBtn.className = 'reply-btn';
        replyBtn.textContent = 'Reply';
        replyBtn.addEventListener('click', () => showReplyForm(comment.id));
        commentDiv.appendChild(replyBtn);

        if (isAdminMode()) {
            const deleteCommentBtn = document.createElement('button');
            deleteCommentBtn.type = 'button';
            deleteCommentBtn.className = 'delete-comment-btn';
            deleteCommentBtn.textContent = 'Delete';
            deleteCommentBtn.addEventListener('click', () => deleteComment(comment.id));
            commentDiv.appendChild(deleteCommentBtn);
        }

        const replyForm = document.createElement('form');
        replyForm.className = 'reply-form';
        replyForm.style.display = 'none';

        const replyTextArea = document.createElement('textarea');
        replyTextArea.placeholder = 'Reply...';
        replyTextArea.required = true;
        replyForm.appendChild(replyTextArea);

        const submitReplyBtn = document.createElement('button');
        submitReplyBtn.type = 'submit';
        submitReplyBtn.textContent = 'Reply';
        replyForm.appendChild(submitReplyBtn);

        const cancelReplyBtn = document.createElement('button');
        cancelReplyBtn.type = 'button';
        cancelReplyBtn.textContent = 'Cancel';
        cancelReplyBtn.addEventListener('click', () => hideReplyForm(cancelReplyBtn));
        replyForm.appendChild(cancelReplyBtn);

        replyForm.addEventListener('submit', event => addComment(event, writingEntryId, comment.id));
        commentDiv.appendChild(replyForm);

        if (comment.replies && comment.replies.length) {
            displayComments(commentDiv, comment.replies, writingEntryId);
        }

        container.appendChild(commentDiv);
    });
}

function displayUploads(tab, uploads) {
    const container = document.getElementById(`${tab}-uploads`);
    if (!container) return;

    container.innerHTML = '';

    if (!uploads.length) {
        const emptyMessage = tab === 'reviews' ? 'No reviews yet.' : 'Nothing here yet.';
        renderEmptyState(container, emptyMessage);
        return;
    }

    uploads
        .slice()
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .forEach(upload => {
            const item = document.createElement('div');
            item.className = 'upload-item';

            if (tab === 'reviews') {
                const title = document.createElement('h3');
                title.textContent = upload.title;
                item.appendChild(title);

                const details = document.createElement('div');
                details.className = 'review-details';
                details.innerHTML = `
                    <p><strong>Author:</strong> ${escapeHtml(upload.author || 'Unknown')}</p>
                    <p><strong>Series:</strong> ${escapeHtml(upload.series || 'N/A')}</p>
                    <p><strong>Genre:</strong> ${escapeHtml(upload.genre || 'Unsorted')}</p>
                    <p><strong>Date Finished:</strong> ${upload.date_finished ? new Date(upload.date_finished).toLocaleDateString() : 'N/A'}</p>
                    <p><strong>Rating:</strong> <span class="rating">${'★'.repeat(upload.rating || 0)}${'☆'.repeat(5 - (upload.rating || 0))}</span></p>
                `;
                item.appendChild(details);

                const reviewBody = upload.review_body || '';
                if (reviewBody) {
                    item.appendChild(createExpandableText(buildTextPreview(reviewBody), {
                        fullText: reviewBody
                    }));
                }

                appendAdminActions(item, 'reviews', upload);
            } else {
                if (upload.file_url) {
                    const link = document.createElement('a');
                    link.href = upload.file_url;
                    link.target = '_blank';
                    link.rel = 'noopener noreferrer';
                    link.innerHTML = `<h3>${escapeHtml(upload.title)}</h3>`;
                    item.appendChild(link);
                } else {
                    const title = document.createElement('h3');
                    title.textContent = upload.title;
                    item.appendChild(title);
                }

                if (upload.type === 'image' && upload.file_url) {
                    const img = document.createElement('img');
                    img.src = upload.file_url;
                    img.alt = upload.title;
                    img.className = 'upload-image';
                    item.appendChild(img);
                } else if (upload.preview || upload.full_text || upload.html) {
                    item.appendChild(createExpandableText(upload.preview || buildTextPreview(upload.full_text || ''), {
                        fullText: upload.full_text || upload.preview || '',
                        html: upload.html || ''
                    }));
                }

                const commentsSection = document.createElement('div');
                commentsSection.className = 'comments-section';
                const commentsTitle = document.createElement('h4');
                commentsTitle.textContent = 'Comments';
                commentsSection.appendChild(commentsTitle);

                const comments = buildCommentTree(
                    writingComments.filter(comment => comment.writing_entry_id === upload.id)
                );

                if (comments.length) {
                    displayComments(commentsSection, comments, upload.id);
                } else {
                    renderEmptyState(commentsSection, 'No comments yet.');
                }

                const commentForm = document.createElement('form');
                commentForm.className = 'comment-form';

                const commentTextArea = document.createElement('textarea');
                commentTextArea.placeholder = 'Add a comment...';
                commentTextArea.required = true;
                commentForm.appendChild(commentTextArea);

                const commentButton = document.createElement('button');
                commentButton.type = 'submit';
                commentButton.textContent = 'Post Comment';
                commentForm.appendChild(commentButton);

                commentForm.addEventListener('submit', event => addComment(event, upload.id, null));
                commentsSection.appendChild(commentForm);
                item.appendChild(commentsSection);

                appendAdminActions(item, 'writing', upload);
            }

            container.appendChild(item);
        });
}

function displayWritingUploads(uploads) {
    const stories = uploads.filter(upload => upload.category === 'stories');
    const randomThoughts = uploads.filter(upload => upload.category === 'random-thoughts');
    displayUploads('writing-stories', stories);
    displayUploads('writing-random-thoughts', randomThoughts);
}

function showReplyForm(commentId) {
    const replyForms = document.querySelectorAll('.reply-form');
    replyForms.forEach(form => {
        form.style.display = 'none';
    });

    const targetComment = document.querySelector(`[data-comment-id="${commentId}"]`);
    if (!targetComment) return;

    const replyForm = targetComment.querySelector('.reply-form');
    if (replyForm) {
        replyForm.style.display = 'block';
    }
}

function hideReplyForm(button) {
    const form = button.closest('.reply-form');
    if (form) {
        form.style.display = 'none';
    }
}

async function loadContent() {
    const [writingResponse, reviewsResponse, commentsResponse] = await Promise.all([
        supabaseClient.from('writing_entries').select('*').order('created_at', { ascending: false }),
        supabaseClient.from('reviews').select('*').order('created_at', { ascending: false }),
        supabaseClient.from('writing_comments').select('*').order('created_at', { ascending: true })
    ]);

    const errors = [writingResponse.error, reviewsResponse.error, commentsResponse.error].filter(Boolean);
    if (errors.length) {
        console.error('Error loading content from Supabase:', errors);
    }

    writingEntries = writingResponse.data || [];
    reviewEntries = reviewsResponse.data || [];
    writingComments = commentsResponse.data || [];

    displayWritingUploads(writingEntries);
    displayUploads('reviews', reviewEntries);
}

async function parseWritingFile(file) {
    const isImage = file.type.startsWith('image/');
    if (isImage) {
        return {
            type: 'image',
            html: null,
            fullText: null,
            preview: null
        };
    }

    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.convertToHtml({ arrayBuffer });
    const html = result.value;
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    const paragraphs = Array.from(tempDiv.querySelectorAll('p'))
        .map(paragraph => paragraph.textContent || '')
        .filter(text => text.trim());

    const fullText = paragraphs.length
        ? paragraphs.join('\n\n')
        : (tempDiv.textContent || '').trim();

    return {
        type: 'docx',
        html,
        fullText,
        preview: buildTextPreview(fullText)
    };
}

async function handleWritingSubmit(event) {
    if (!isAdminMode()) {
        alert('Admin mode is required to upload writing.');
        return;
    }

    const fileInput = document.getElementById('writing-file');
    const file = fileInput ? fileInput.files[0] : null;
    if (!file) {
        alert('Choose a file to upload first.');
        return;
    }

    const categoryInput = document.getElementById('writing-category');
    const category = categoryInput ? categoryInput.value : 'stories';

    let parsedFile;
    try {
        parsedFile = await parseWritingFile(file);
    } catch (error) {
        console.error('Error reading writing file:', error);
        alert('That file could not be read. Please try a DOCX or image file.');
        return;
    }

    const filePath = `${Date.now()}-${sanitizeFileName(file.name)}`;
    const { error: uploadError } = await supabaseClient.storage
        .from(WRITING_BUCKET)
        .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
            contentType: file.type || undefined
        });

    if (uploadError) {
        console.error('Error uploading writing file:', uploadError);
        alert(`Upload failed: ${uploadError.message}`);
        return;
    }

    const { data: publicUrlData } = supabaseClient.storage
        .from(WRITING_BUCKET)
        .getPublicUrl(filePath);

    const entry = {
        title: file.name,
        category,
        type: parsedFile.type,
        file_name: file.name,
        file_path: filePath,
        file_url: publicUrlData.publicUrl,
        preview: parsedFile.type === 'image' ? publicUrlData.publicUrl : parsedFile.preview,
        full_text: parsedFile.fullText,
        html: parsedFile.html
    };

    const { error: insertError } = await supabaseClient.from('writing_entries').insert(entry);
    if (insertError) {
        console.error('Error saving writing entry:', insertError);
        await supabaseClient.storage.from(WRITING_BUCKET).remove([filePath]);
        alert(`Saving failed: ${insertError.message}`);
        return;
    }

    event.target.reset();
    await loadContent();
}

async function handleReviewSubmit(event) {
    if (!isAdminMode()) {
        alert('Admin mode is required to add or modify reviews.');
        return;
    }

    const formData = new FormData(event.target);
    const reviewBody = (formData.get('review-body') || '').trim();

    const review = {
        title: (formData.get('book-title') || '').trim(),
        author: (formData.get('author') || '').trim(),
        series: (formData.get('series') || '').trim(),
        genre: (formData.get('genre') || '').trim(),
        date_finished: formData.get('date-finished'),
        rating: parseInt(formData.get('rating'), 10) || 0,
        review_body: reviewBody
    };

    const { error } = await supabaseClient.from('reviews').insert(review);
    if (error) {
        console.error('Error saving review:', error);
        alert(`Review could not be saved: ${error.message}`);
        return;
    }

    event.target.reset();
    await loadContent();
}

async function addComment(event, writingEntryId, parentId) {
    event.preventDefault();

    const textarea = event.target.querySelector('textarea');
    const text = textarea ? textarea.value.trim() : '';
    if (!text) return;

    const { error } = await supabaseClient.from('writing_comments').insert({
        writing_entry_id: writingEntryId,
        parent_id: parentId,
        text
    });

    if (error) {
        console.error('Error saving comment:', error);
        alert(`Comment could not be saved: ${error.message}`);
        return;
    }

    event.target.reset();
    await loadContent();
}

async function deleteComment(commentId) {
    if (!isAdminMode()) {
        alert('Admin mode is required to delete comments.');
        return;
    }

    if (!confirm('Are you sure you want to delete this comment?')) return;

    const { error } = await supabaseClient.from('writing_comments').delete().eq('id', commentId);
    if (error) {
        console.error('Error deleting comment:', error);
        alert(`Comment could not be deleted: ${error.message}`);
        return;
    }

    await loadContent();
}

function handleUpload(event, tab) {
    event.preventDefault();

    if (tab === 'reviews') {
        handleReviewSubmit(event);
        return;
    }

    handleWritingSubmit(event);
}

async function handleAdminSignIn(event) {
    event.preventDefault();

    const email = document.getElementById('auth-email').value.trim();
    const password = document.getElementById('auth-password').value;

    setAuthMessage('Signing in...');
    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });

    if (error) {
        console.error('Error signing in:', error);
        setAuthMessage(error.message, 'error');
        return;
    }

    setAuthMessage('Signed in successfully.', 'success');
}

function createEditModalContent(tab, upload) {
    if (tab === 'reviews') {
        return `
            <h3>Edit Review</h3>
            <label>Book Title:</label>
            <input type="text" id="edit-title">
            <label>Author:</label>
            <input type="text" id="edit-author">
            <label>Series:</label>
            <input type="text" id="edit-series">
            <label>Genre:</label>
            <input type="text" id="edit-genre">
            <label>Rating:</label>
            <select id="edit-rating">
                <option value="1">1 Star</option>
                <option value="2">2 Stars</option>
                <option value="3">3 Stars</option>
                <option value="4">4 Stars</option>
                <option value="5">5 Stars</option>
            </select>
            <label>Date Finished:</label>
            <input type="date" id="edit-date-finished">
            <label>Review:</label>
            <textarea id="edit-review-body" rows="8"></textarea>
            <div class="edit-modal-buttons">
                <button id="save-edit-btn" class="save-btn" type="button">Save Changes</button>
                <button id="cancel-edit-btn" class="cancel-btn" type="button">Cancel</button>
            </div>
        `;
    }

    const textEditor = upload.type === 'image'
        ? ''
        : `
            <label>Displayed Text:</label>
            <textarea id="edit-fulltext" rows="12">${escapeHtml(upload.full_text || '')}</textarea>
            <p>This updates the text shown on the site. The original uploaded file stays the same.</p>
        `;

    return `
        <h3>Edit Writing Entry</h3>
        <label>Title:</label>
        <input type="text" id="edit-title">
        <label>Section:</label>
        <select id="edit-category">
            <option value="stories">Stories</option>
            <option value="random-thoughts">Random Thoughts</option>
        </select>
        ${textEditor}
        <div class="edit-modal-buttons">
            <button id="save-edit-btn" class="save-btn" type="button">Save Changes</button>
            <button id="cancel-edit-btn" class="cancel-btn" type="button">Cancel</button>
        </div>
    `;
}

function openEditModal(tab, upload) {
    if (!isAdminMode()) {
        alert('Admin mode is required to edit content.');
        return;
    }

    const modal = document.createElement('div');
    modal.className = 'edit-modal';

    const modalContent = document.createElement('div');
    modalContent.className = 'edit-modal-content';
    modalContent.innerHTML = createEditModalContent(tab, upload);

    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    document.getElementById('edit-title').value = upload.title || '';

    if (tab === 'reviews') {
        document.getElementById('edit-author').value = upload.author || '';
        document.getElementById('edit-series').value = upload.series || '';
        document.getElementById('edit-genre').value = upload.genre || '';
        document.getElementById('edit-rating').value = upload.rating || 3;
        document.getElementById('edit-date-finished').value = upload.date_finished || '';
        document.getElementById('edit-review-body').value = upload.review_body || '';
    } else {
        document.getElementById('edit-category').value = upload.category || 'stories';
        const textArea = document.getElementById('edit-fulltext');
        if (textArea) {
            textArea.value = upload.full_text || '';
        }
    }

    document.getElementById('save-edit-btn').addEventListener('click', () => {
        saveEditUpload(tab, upload, modal);
    });
    document.getElementById('cancel-edit-btn').addEventListener('click', () => {
        modal.remove();
    });
    modal.addEventListener('click', event => {
        if (event.target === modal) {
            modal.remove();
        }
    });
}

async function saveEditUpload(tab, upload, modal) {
    if (!isAdminMode()) {
        alert('Admin mode is required to edit content.');
        return;
    }

    if (tab === 'reviews') {
        const updates = {
            title: document.getElementById('edit-title').value.trim(),
            author: document.getElementById('edit-author').value.trim(),
            series: document.getElementById('edit-series').value.trim(),
            genre: document.getElementById('edit-genre').value.trim(),
            rating: parseInt(document.getElementById('edit-rating').value, 10) || 0,
            date_finished: document.getElementById('edit-date-finished').value,
            review_body: document.getElementById('edit-review-body').value.trim()
        };

        const { error } = await supabaseClient.from('reviews').update(updates).eq('id', upload.id);
        if (error) {
            console.error('Error updating review:', error);
            alert(`Review could not be updated: ${error.message}`);
            return;
        }
    } else {
        const updates = {
            title: document.getElementById('edit-title').value.trim(),
            category: document.getElementById('edit-category').value
        };

        const textArea = document.getElementById('edit-fulltext');
        if (textArea) {
            const newText = textArea.value.trim();
            updates.full_text = newText;
            updates.preview = buildTextPreview(newText);
            updates.html = convertPlainTextToHtml(newText);
        }

        const { error } = await supabaseClient.from('writing_entries').update(updates).eq('id', upload.id);
        if (error) {
            console.error('Error updating writing entry:', error);
            alert(`Writing entry could not be updated: ${error.message}`);
            return;
        }
    }

    modal.remove();
    await loadContent();
}

async function deleteUpload(tab, upload) {
    if (!isAdminMode()) {
        alert('Admin mode is required to delete content.');
        return;
    }

    if (!confirm('Are you sure you want to delete this item?')) return;

    if (tab === 'reviews') {
        const { error } = await supabaseClient.from('reviews').delete().eq('id', upload.id);
        if (error) {
            console.error('Error deleting review:', error);
            alert(`Review could not be deleted: ${error.message}`);
            return;
        }
    } else {
        const { error } = await supabaseClient.from('writing_entries').delete().eq('id', upload.id);
        if (error) {
            console.error('Error deleting writing entry:', error);
            alert(`Writing entry could not be deleted: ${error.message}`);
            return;
        }

        if (upload.file_path) {
            const { error: storageError } = await supabaseClient.storage
                .from(WRITING_BUCKET)
                .remove([upload.file_path]);
            if (storageError) {
                console.error('Error deleting file from storage:', storageError);
            }
        }
    }

    await loadContent();
}

async function toggleAdminMode() {
    if (isAdminMode()) {
        const { error } = await supabaseClient.auth.signOut();
        if (error) {
            console.error('Error signing out:', error);
            alert(`Could not sign out: ${error.message}`);
        }
        return;
    }

    openAuthModal();
}

async function handleSongEmbed(event) {
    event.preventDefault();

    if (!isAdminMode()) {
        alert('Admin mode is required to update the song of the day.');
        return;
    }

    const input = document.getElementById('song-embed');
    const value = input.value.trim();
    if (!value) return;

    const trackId = extractTrackId(value);
    const { error } = await supabaseClient.from('song_of_the_day').upsert({
        id: SONG_ROW_ID,
        track_id: trackId,
        updated_at: new Date().toISOString()
    }, {
        onConflict: 'id'
    });

    if (error) {
        console.error('Error saving song of the day:', error);
        alert(`Song could not be updated: ${error.message}`);
        return;
    }

    input.value = '';
    await loadSongOfTheDay();
}

async function loadSongOfTheDay() {
    const display = document.getElementById('song-display');
    if (!display) return;

    const { data, error } = await supabaseClient
        .from('song_of_the_day')
        .select('*')
        .eq('id', SONG_ROW_ID)
        .maybeSingle();

    if (error) {
        console.error('Error loading song of the day:', error);
        display.innerHTML = '<p>Song data is not available yet.</p>';
        return;
    }

    if (!data || !data.track_id) {
        display.innerHTML = '<p>No song embedded yet.</p>';
        return;
    }

    displaySongOfTheDay(data);
}

function displaySongOfTheDay(songData) {
    const display = document.getElementById('song-display');
    if (!display) return;

    const embedUrl = `https://open.spotify.com/embed/track/${songData.track_id}`;
    display.innerHTML = `
        <iframe src="${embedUrl}" width="100%" height="352" frameborder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>
    `;

    if (window.Spotify && window.Spotify.Embed) {
        window.Spotify.Embed.reload();
    }
}

function bindAppEventListeners() {
    document.getElementById('writing-form').addEventListener('submit', event => handleUpload(event, 'writing'));
    document.getElementById('reviews-form').addEventListener('submit', event => handleUpload(event, 'reviews'));
    document.getElementById('song-form').addEventListener('submit', handleSongEmbed);
    document.getElementById('auth-form').addEventListener('submit', handleAdminSignIn);
    document.getElementById('auth-close').addEventListener('click', closeAuthModal);

    const authModal = document.getElementById('auth-modal');
    authModal.addEventListener('click', event => {
        if (event.target === authModal) {
            closeAuthModal();
        }
    });

    document.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
            closeAuthModal();
        }
    });
}

async function initializeAuth() {
    const { data, error } = await supabaseClient.auth.getSession();
    if (error) {
        console.error('Error restoring session:', error);
    }

    currentUser = data.session?.user || null;
    updateAdminUI();

    supabaseClient.auth.onAuthStateChange(async (_event, session) => {
        currentUser = session?.user || null;
        updateAdminUI();
        if (currentUser) {
            closeAuthModal();
        }
        await Promise.all([loadContent(), loadSongOfTheDay()]);
    });
}

window.addEventListener('load', async () => {
    bindAppEventListeners();
    initializePromptGenerator();
    await initializeAuth();
    await Promise.all([loadContent(), loadSongOfTheDay()]);
});

// ============ PROMPT GENERATOR ============

const characterSeeds = [
  "A retired circus acrobat",
  "A shy lighthouse keeper",
  "A street artist",
  "A time-traveling historian",
  "A detective who can hear animals",
  "An apprentice alchemist",
  "A janitor at an abandoned museum",
  "A royal chef",
  "A quiet librarian",
  "A traveling musician",
  "A scientist in a floating lab",
  "A courier between rival cities",
  "A herbalist trusted by thieves and nobles",
  "A former prophet",
  "A cartographer mapping shifting islands",
  "A retired pirate",
  "A twin separated at birth",
  "A circus fortune-teller",
  "A mechanic of clockwork creatures",
  "A ghost whisperer",
  "A street vendor who sells stories",
  "A watercolor witch",
  "A scholar decoding a star map",
  "A young noble rebel",
  "A firefighter who gains the memories of those he touches",
  "A baker who once defeated a dragon",
  "A former soldier with very little promise",
  "A puppeteer with living creations",
  "A biologist who grows living glass",
  "A refugee from a now non existent homeland"
];

const characterModifiers = [
  "who runs a bakery underground",
  "who receives secret letters at midnight",
  "whose murals hide coded warnings",
  "stuck in a small town",
  "who hears the thoughts of animals",
  "searching for a vanished mentor",
  "with a magical mop",
  "who once cooked for rebels",
  "secretly cataloging a ghost library",
  "collecting forgotten lullabies",
  "studying dreams caught in wayward tears",
  "delivering messages between rival cities",
  "trusted by both thieves and nobles",
  "losing the ability to predict",
  "mapping islands that appear overnight",
  "pretending to be a shipwright",
  "who discovers they have a twin through puberty induced telepathy",
  "with a real ability to see exactly three days and two nights into the past and future",
  "who rebuilds clockwork creatures to prepare for a digital dystopia",
  "recruited by a sentient pocketwatch",
  "who sells stories instead of food",
  "who accidentally creates life through paintings",
  "obsessed with a broken star map found on their thigh",
  "rebelling against a peaceful destiny",
  "rescuing pigs to have a monopoly on pork",
  "who defeated a dragon with pastries",
  "haunted by a promise they made",
  "whose creations move on their own",
  "whose bones grow outside their body",
  "remembering that they were genetically 75% colonizer"
];

const locationSeeds = [
  "A flooded library built on the bones of a ship",
  "A hidden market beneath a city of mirrors",
  "A cliffside village carved from stone",
  "A ruined mansion overgrown with vines",
  "A crescent-shaped island with singing dunes",
  "A train that never stops traveling through seasons",
  "A forest where the trees hum at dusk",
  "A marketplace inside an observatory dome",
  "A canyon filled with floating lanterns",
  "A secret garden inside a clock tower",
  "A mountain monastery lit by violet lanterns",
  "A palace around a sleeping volcano",
  "A shipyard where ships are grown from wood",
  "A coastal town with glass streets",
  "A winter village under a permanent aurora",
  "A cavern of crystalline sculptures",
  "A desert bazaar atop sandstone mesas",
  "A village inside an enormous bell",
  "A university suspended over a canyon",
  "A coastal ruin with coral statues",
  "A canyon town on rope bridges",
  "A floating farm above a sleeping city",
  "A city of lanterns hidden in mist",
  "A lighthouse on a foggy island",
  "A palace garden with message trees",
  "A quarry turned into a market",
  "A subway station to a forgotten realm",
  "A river village where boats are roads",
  "A castle in the hollow of a tree",
  "A workshop in a house that moves"
];

const locationModifiers = [
  "at midnight",
  "during the harvest festival",
  "under a violet moon",
  "when the tides are high",
  "in a place that changes every dawn",
  "while fog rolls in",
  "after a long drought",
  "when the bells begin to ring",
  "just before the first snowfall",
  "during the summer solstice"
];

const motiveSeeds = [
  "Searching for a lost family heirloom",
  "Protecting a secret that could topple a kingdom",
  "Proving their worth to a skeptical mentor",
  "Escaping a promise made long ago",
  "Finding the truth behind a childhood memory",
  "Protecting an innocent friend from a curse",
  "Unlocking a locked city gate before dawn",
  "Saving a stranger who reminds them of themselves",
  "Retrieving a stolen artifact of great power",
  "Bringing a long-lost family member home",
  "Averting a prophecy nobody believes in",
  "Recovering a borrowed spellbook before it fades",
  "Stopping a rivalry from becoming a war",
  "Exposing a conspiracy within a peaceful court",
  "Proving their innocence after a framed crime",
  "Keeping a rival from finding the same treasure",
  "Learning the real meaning of a fade",
  "Finding forgiveness for a mistake in the past",
  "Teaching someone an old secret to save them",
  "Breaking a bond that was forced upon them",
  "Saving a sacred place from being destroyed",
  "Continuing a family tradition in a new way",
  "Finding a place where they can truly belong",
  "Recovering a lost map to a hidden sanctuary",
  "Freeing someone trapped by an old bargain",
  "Keeping a dangerous power away from greedy hands",
  "Uncovering the reason behind a vanished city",
  "Finishing a mission their mentor could not",
  "Assembling a team for a risky final journey",
  "Bridging two sides that have been at odds"
];

const motiveModifiers = [
  "before the rival arrives",
  "to keep an old promise",
  "to repay a debt",
  "before the secret is revealed",
  "even though it could endanger them",
  "while hiding their true goal",
  "without anyone knowing",
  "before the deadline",
  "before the moon sets",
  "to restore their family name"
];

const complicationSeeds = [
  "A trusted ally is secretly an enemy",
  "A storm arrives just as the journey begins",
  "Their memories change every time they wake",
  "A rival discovers the same clue at the same moment",
  "A friend disappears into a locked room",
  "The safe place turns out to be a trap",
  "A strange illness changes how they perceive truth",
  "A map leads to a different location every hour",
  "The artifact is cursed and cannot leave the city",
  "A lie from the past returns to threaten the plan",
  "The key item is missing when they need it most",
  "A quiet witness refuses to speak until midnight",
  "The path home closes after the first decision",
  "The villain is not the real threat",
  "They must choose between saving a friend or the mission",
  "A promise forces them to break another promise",
  "The only guide knows only half the way",
  "The town's law forbids the very thing they must do",
  "An unexpected visitor brings a dangerous gift",
  "The evidence disappears from the scene overnight",
  "A bargain with a stranger carries a hidden cost",
  "The spell to protect them works only once",
  "Their own power attracts attention from above",
  "A private note is discovered by their rival",
  "A familiar object turns out to be an imitation",
  "The weather reveals what the sun would hide",
  "A secret passage collapses behind them",
  "The person they were saving asks them to stop",
  "The solution requires sacrificing something precious",
  "A celebration is interrupted by a sudden alarm"
];

const complicationModifiers = [
  "while the city watch is nearby",
  "as the skies begin to crack",
  "just as the bridge collapses",
  "when the bell breaks",
  "while a festival draws a crowd",
  "while they are being followed",
  "when their map bursts into flames",
  "as their most trusted ally disappears",
  "while time seems to slow",
  "when a second stranger appears"
];

const characterTwists = [
  "while their best idea keeps making things worse",
  "and nobody believes the part they are telling truthfully",
  "with a secret they can no longer afford to keep",
  "and a habit of following the wrong clue first",
  "while trying not to become the thing they fear",
  "with one impossible favor still unpaid",
  "as an old enemy starts acting like a friend",
  "while a rumor about them spreads faster than they can move",
  "and only one person notices what they are really after",
  "while their own past keeps interrupting the plan"
];

const locationTwists = [
  "where every doorway seems to test a different fear",
  "and the locals treat one ordinary rule as sacred",
  "where the weather keeps changing its mind",
  "and something important always goes missing by morning",
  "where every celebration hides a warning",
  "and the silence there feels deliberate",
  "where no map agrees with the last one",
  "and the oldest building refuses to stay abandoned",
  "where strangers are welcomed a little too quickly",
  "and everybody seems to be waiting for the same sign"
];

const motiveTwists = [
  "even if it costs them the life they have now",
  "while pretending they want something else entirely",
  "before the wrong person understands what is at stake",
  "without becoming the villain in someone else's story",
  "while carrying more guilt than they admit",
  "before their courage runs out",
  "without losing the one person still on their side",
  "while their own heart keeps complicating the choice",
  "before the chance disappears for good",
  "even though success might change them forever"
];

const complicationTwists = [
  "and everyone involved has a different version of the truth",
  "just when an easy answer seems possible",
  "and the backup plan is somehow worse",
  "before they have time to recover from the last mistake",
  "while nobody can agree on who caused it",
  "and the one person who can help is already leaving",
  "just as they begin to trust themselves again",
  "while the crowd mistakes danger for entertainment",
  "and the cost becomes clear too late",
  "before the original plan can even begin"
];

function shuffleArray(items) {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }

  return copy;
}

function buildPrompts(seeds, appenders, twists, count) {
  const combinations = [];

  seeds.forEach((seed) => {
    appenders.forEach((appender) => {
      twists.forEach((twist) => {
        combinations.push(`${seed} ${appender}, ${twist}`);
      });
    });
  });

  return shuffleArray(combinations).slice(0, count);
}

const promptSets = {
  character: buildPrompts(characterSeeds, characterModifiers, characterTwists, 500),
  location: buildPrompts(locationSeeds, locationModifiers, locationTwists, 500),
  motive: buildPrompts(motiveSeeds, motiveModifiers, motiveTwists, 500),
  complication: buildPrompts(complicationSeeds, complicationModifiers, complicationTwists, 500)
};

let results = {};
const timerButtonsMap = {};
let timerInterval = null;
let timerRemaining = 0;

function initializePromptGenerator() {
  results = {
    character: document.getElementById('result-character'),
    location: document.getElementById('result-location'),
    motive: document.getElementById('result-motive'),
    complication: document.getElementById('result-complication')
  };

  const timerDisplay = document.getElementById('timer-display');
  const timerButtons = document.querySelectorAll('.timer-btn');
  const timerStopButton = document.getElementById('timer-stop');

  Object.entries(promptSets).forEach(([category]) => {
    const card = document.querySelector(`.wheel-card[data-wheel="${category}"]`);
    if (card) {
      card.addEventListener('click', () => spinDisplay(card, category));
    }
  });

  timerButtons.forEach((button) => {
    if (button !== timerStopButton) {
      button.addEventListener('click', () => {
        const minutes = Number(button.dataset.minutes);
        if (!Number.isFinite(minutes) || minutes <= 0) return;
        startTimer(minutes);
      });
    }
  });

  if (timerStopButton) {
    timerStopButton.addEventListener('click', () => {
      stopTimer(true);
      setActiveTimerButton(null);
    });
  }

  document.addEventListener('keydown', (event) => {
    const isTypingContext = event.target instanceof HTMLElement &&
      event.target.closest('input, textarea, select, button, form, [contenteditable="true"]');

    if (isTypingContext) {
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      spinAllWheels();
    }
  });
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
  const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${minutes}:${secs}`;
}

function updateTimerDisplay() {
  const timerDisplay = document.getElementById('timer-display');
  if (!timerDisplay) return;
  timerDisplay.textContent = timerRemaining > 0 ? formatTime(timerRemaining) : '00:00';
}

function setActiveTimerButton(duration) {
  const timerButtons = document.querySelectorAll('.timer-btn');
  timerButtons.forEach((button) => {
    if (button.id !== 'timer-stop') {
      const minutes = Number(button.dataset.minutes);
      button.classList.toggle('active', minutes === duration);
    }
  });
}

function stopTimer(resetDisplay = false) {
  clearInterval(timerInterval);
  timerInterval = null;
  timerRemaining = 0;
  if (resetDisplay) {
    const timerDisplay = document.getElementById('timer-display');
    if (timerDisplay) {
      timerDisplay.textContent = '00:00';
    }
  }
}

function startTimer(minutes) {
  stopTimer();
  timerRemaining = minutes * 60;
  setActiveTimerButton(minutes);
  updateTimerDisplay();

  timerInterval = setInterval(() => {
    timerRemaining -= 1;
    if (timerRemaining <= 0) {
      stopTimer();
      const timerDisplay = document.getElementById('timer-display');
      if (timerDisplay) {
        timerDisplay.textContent = "Time's up!";
      }
      setActiveTimerButton(null);
      return;
    }

    updateTimerDisplay();
  }, 1000);
}

function choosePrompt(category) {
  const items = promptSets[category];
  const index = Math.floor(Math.random() * items.length);
  return items[index];
}

function spinDisplay(card, category) {
  const wheel = card.querySelector('.wheel');
  if (!wheel || wheel.classList.contains('spin')) {
    return;
  }

  wheel.classList.add('spin');
  if (results[category]) {
    results[category].textContent = 'Spinning...';
  }

  setTimeout(() => {
    const resultText = choosePrompt(category);
    if (results[category]) {
      results[category].textContent = resultText;
    }
    wheel.classList.remove('spin');
  }, 1200);
}

function spinAllWheels() {
  document.querySelectorAll('.wheel-card').forEach((card) => {
    const category = card.dataset.wheel;
    spinDisplay(card, category);
  });
}
