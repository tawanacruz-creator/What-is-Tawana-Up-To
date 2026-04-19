function openTab(tabName) {
    // Hide all tab contents
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(content => content.classList.remove('active'));

    // Remove active class from all buttons
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => button.classList.remove('active'));

    // Show the selected tab content
    document.getElementById(tabName).classList.add('active');

    // Add active class to the clicked button
    event.target.classList.add('active');
}

// Load uploads from localStorage
function loadUploads() {
    const writingUploads = JSON.parse(localStorage.getItem('writingUploads') || '[]');
    const reviewsUploads = JSON.parse(localStorage.getItem('reviewsUploads') || '[]');
    displayWritingUploads(writingUploads);
    displayUploads('reviews', reviewsUploads);
}

function displayWritingUploads(uploads) {
    const stories = uploads.filter(upload => upload.category === 'stories');
    const randomThoughts = uploads.filter(upload => upload.category === 'random-thoughts');
    displayUploads('writing-stories', stories);
    displayUploads('writing-random-thoughts', randomThoughts);
}

// Display uploads for a tab
function displayUploads(tab, uploads) {
    const container = document.getElementById(tab + '-uploads');
    if (!container) return;
    container.innerHTML = '';
    uploads.sort((a, b) => new Date(b.date) - new Date(a.date)); // Chronological descending
    uploads.forEach((upload, index) => {
        const item = document.createElement('div');
        item.className = 'upload-item';
        if (tab === 'reviews') {
            // Build review details
            const detailsDiv = document.createElement('div');
            detailsDiv.innerHTML = `
                <h3>${upload.title}</h3>
                <div class="review-details">
                    <p><strong>Author:</strong> ${upload.author}</p>
                    <p><strong>Series:</strong> ${upload.series || 'N/A'}</p>
                    <p><strong>Genre:</strong> ${upload.genre}</p>
                    <p><strong>Date Finished:</strong> ${new Date(upload.dateFinished).toLocaleDateString()}</p>
                    <p><strong>Rating:</strong> <span class="rating">${'★'.repeat(upload.rating)}${'☆'.repeat(5 - upload.rating)}</span></p>
                </div>
            `;
            item.appendChild(detailsDiv);
            if (upload.fileUrl) {
                const link = document.createElement('a');
                link.href = upload.fileUrl;
                link.download = upload.fileName || 'review-file';
                link.textContent = 'Download attached file';
                item.appendChild(link);
            }
            if (upload.preview) {
                if (upload.type === 'image') {
                    const img = document.createElement('img');
                    img.src = upload.preview;
                    img.className = 'upload-image';
                    item.appendChild(img);
                } else {
                    // Collapsible, formatted text preview for reviews
                    const previewContainer = document.createElement('div');
                    previewContainer.className = 'text-preview-container';

                    // Preview (first 2 lines)
                    const previewDiv = document.createElement('div');
                    previewDiv.className = 'text-preview collapsed';
                    const previewText = document.createElement('p');
                    previewText.className = 'upload-preview';
                    previewText.textContent = upload.preview;
                    previewDiv.appendChild(previewText);
                    previewContainer.appendChild(previewDiv);

                    // Full text (hidden by default)
                    const fullDiv = document.createElement('div');
                    fullDiv.className = 'text-full';
                    fullDiv.style.display = 'none';
                    if (upload.html) {
                        fullDiv.innerHTML = upload.html;
                    } else {
                        const fullText = document.createElement('p');
                        fullText.className = 'upload-preview';
                        fullText.textContent = upload.fullText || upload.preview;
                        fullDiv.appendChild(fullText);
                    }
                    previewContainer.appendChild(fullDiv);

                    // Expand/collapse button
                    const expandBtn = document.createElement('button');
                    expandBtn.className = 'expand-text-btn';
                    expandBtn.innerHTML = '▼ Show More';
                    expandBtn.addEventListener('click', function() {
                        const isExpanded = fullDiv.style.display !== 'none';
                        if (isExpanded) {
                            fullDiv.style.display = 'none';
                            previewDiv.classList.add('collapsed');
                            expandBtn.innerHTML = '▼ Show More';
                        } else {
                            fullDiv.style.display = 'block';
                            previewDiv.classList.remove('collapsed');
                            expandBtn.innerHTML = '▲ Show Less';
                        }
                    });
                    previewContainer.appendChild(expandBtn);
                    item.appendChild(previewContainer);
                }
            }
        } else {
            const link = document.createElement('a');
            link.href = upload.url;
            link.download = upload.title;
            link.innerHTML = `<h3>${upload.title}</h3>`;
            item.appendChild(link);
            if (upload.type === 'image') {
                const img = document.createElement('img');
                img.src = upload.preview;
                img.className = 'upload-image';
                item.appendChild(img);
            } else {
                // Create collapsible text preview
                const previewContainer = document.createElement('div');
                previewContainer.className = 'text-preview-container';
                
                // Preview (first 2 lines)
                const previewDiv = document.createElement('div');
                previewDiv.className = 'text-preview collapsed';
                const previewText = document.createElement('p');
                previewText.className = 'upload-preview';
                previewText.textContent = upload.preview;
                previewDiv.appendChild(previewText);
                previewContainer.appendChild(previewDiv);
                
                // Full text (hidden by default)
                const fullDiv = document.createElement('div');
                fullDiv.className = 'text-full';
                fullDiv.style.display = 'none';
                if (upload.html) {
                    fullDiv.className = 'text-full';
                    fullDiv.innerHTML = upload.html;
                } else {
                    const fullText = document.createElement('p');
                    fullText.className = 'upload-preview';
                    fullText.textContent = upload.fullText || upload.preview;
                    fullDiv.appendChild(fullText);
                }
                previewContainer.appendChild(fullDiv);
                
                // Expand/collapse button
                const expandBtn = document.createElement('button');
                expandBtn.className = 'expand-text-btn';
                expandBtn.innerHTML = '▼ Show More';
                expandBtn.addEventListener('click', function() {
                    const isExpanded = fullDiv.style.display !== 'none';
                    if (isExpanded) {
                        fullDiv.style.display = 'none';
                        previewDiv.classList.add('collapsed');
                        expandBtn.innerHTML = '▼ Show More';
                    } else {
                        fullDiv.style.display = 'block';
                        previewDiv.classList.remove('collapsed');
                        expandBtn.innerHTML = '▲ Show Less';
                    }
                });
                previewContainer.appendChild(expandBtn);
                item.appendChild(previewContainer);
            }
            // Add comments section
            const commentsDiv = document.createElement('div');
            commentsDiv.className = 'comments-section';
            commentsDiv.innerHTML = '<h4>Comments</h4>';
            displayComments(commentsDiv, upload.comments || [], index, null);
            const commentForm = document.createElement('form');
            commentForm.className = 'comment-form';
            commentForm.innerHTML = `
                <textarea placeholder="Add a comment..." required></textarea>
                <button type="submit">Post Comment</button>
            `;
            commentForm.addEventListener('submit', (e) => addComment(e, index, null));
            commentsDiv.appendChild(commentForm);
            item.appendChild(commentsDiv);
        }
        // Add delete button if in admin mode
        if (localStorage.getItem('isAdmin') === 'true') {
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.textContent = 'Delete File';
            deleteBtn.addEventListener('click', () => deleteUpload(tab, upload));
            item.appendChild(deleteBtn);
        }
        container.appendChild(item);
    });
}

function displayComments(container, comments, uploadIndex, parentId) {
    comments.forEach((comment, commentIndex) => {
        const commentDiv = document.createElement('div');
        commentDiv.className = 'comment';
        commentDiv.setAttribute('data-comment-id', comment.id);
        commentDiv.innerHTML = `
            <p>${comment.text}</p>
            <small>${new Date(comment.date).toLocaleString()}</small>
            <button class="reply-btn" onclick="showReplyForm('${comment.id}')">Reply</button>
        `;
        
        // Add delete button for comment if in admin mode
        if (localStorage.getItem('isAdmin') === 'true') {
            const deleteCommentBtn = document.createElement('button');
            deleteCommentBtn.className = 'delete-comment-btn';
            deleteCommentBtn.textContent = 'Delete';
            deleteCommentBtn.addEventListener('click', () => deleteComment(uploadIndex, comment.id, parentId));
            commentDiv.appendChild(deleteCommentBtn);
        }
        
        const replyForm = document.createElement('form');
        replyForm.className = 'reply-form';
        replyForm.style.display = 'none';
        replyForm.innerHTML = `
            <textarea placeholder="Reply..." required></textarea>
            <button type="submit">Reply</button>
            <button type="button" onclick="hideReplyForm(this)">Cancel</button>
        `;
        replyForm.addEventListener('submit', (e) => addComment(e, uploadIndex, comment.id));
        commentDiv.appendChild(replyForm);
        if (comment.replies) {
            displayComments(commentDiv, comment.replies, uploadIndex, comment.id);
        }
        container.appendChild(commentDiv);
    });
}

function showReplyForm(commentId) {
    const replyForms = document.querySelectorAll('.reply-form');
    replyForms.forEach(form => form.style.display = 'none');
    const targetComment = document.querySelector(`[data-comment-id="${commentId}"]`);
    if (targetComment) {
        const replyForm = targetComment.querySelector('.reply-form');
        if (replyForm) {
            replyForm.style.display = 'block';
        }
    }
}

function hideReplyForm(button) {
    button.parentElement.style.display = 'none';
}

function addComment(event, uploadIndex, parentId) {
    event.preventDefault();
    const textarea = event.target.querySelector('textarea');
    const text = textarea.value.trim();
    if (!text) return;
    const comment = {
        id: Date.now().toString(),
        text: text,
        date: new Date().toISOString()
    };
    const uploads = JSON.parse(localStorage.getItem('writingUploads') || '[]');
    if (parentId) {
        // Find the parent comment and add reply
        function addReply(comments) {
            for (let c of comments) {
                if (c.id === parentId) {
                    if (!c.replies) c.replies = [];
                    c.replies.push(comment);
                    return true;
                }
                if (c.replies && addReply(c.replies)) return true;
            }
            return false;
        }
        addReply(uploads[uploadIndex].comments || []);
    } else {
        if (!uploads[uploadIndex].comments) uploads[uploadIndex].comments = [];
        uploads[uploadIndex].comments.push(comment);
    }
    localStorage.setItem('writingUploads', JSON.stringify(uploads));
    displayUploads('writing', uploads);
}

// Handle form submission
function handleUpload(event, tab) {
    event.preventDefault();
    if (tab === 'reviews') {
        handleReviewSubmit(event);
    } else {
        const fileInput = event.target.querySelector('input[type="file"]');
        const file = fileInput.files[0];
        if (!file) return;

        const categoryInput = document.getElementById('writing-category');
        const category = categoryInput ? categoryInput.value : 'stories';

        const reader = new FileReader();
        reader.onload = function(e) {
            const arrayBuffer = e.target.result;
            const upload = {
                id: Date.now().toString() + Math.random().toString(36).substr(2, 9), // unique ID
                title: file.name,
                date: new Date().toISOString(),
                category: category,
                type: file.type.startsWith('image/') ? 'image' : 'docx'
            };

            if (upload.type === 'image') {
                upload.preview = e.target.result; // data URL
                upload.url = e.target.result;
                saveUpload(tab, upload);
            } else {
                // Convert DOCX to HTML
                mammoth.convertToHtml({arrayBuffer: arrayBuffer})
                    .then(function(result) {
                        const html = result.value;
                        // Store the formatted HTML for display
                        upload.html = html;
                        
                        // Extract text while preserving formatting info
                        const tempDiv = document.createElement('div');
                        tempDiv.innerHTML = html;
                        
                        // Get text with ALL spacing preserved from paragraphs
                        const paragraphs = tempDiv.querySelectorAll('p');
                        const textLines = [];
                        paragraphs.forEach(p => {
                            // Get all text content without trimming (preserves spacing)
                            const text = p.textContent;
                            if (text.trim()) { // Only include non-empty paragraphs
                                textLines.push(text); // Keep original spacing
                            }
                        });
                        
                        const fullText = textLines.join('\n\n'); // Double line break between paragraphs
                        upload.fullText = fullText; // Store the full text for editing
                        
                        // Create preview from first 2 paragraphs
                        upload.preview = textLines.slice(0, 2).join('\n\n');
                        
                        // Download as HTML to preserve formatting
                        upload.url = 'data:text/html;charset=utf-8,' + encodeURIComponent(html);
                        saveUpload(tab, upload);
                    })
                    .catch(function(err) {
                        console.error('Error converting DOCX:', err);
                        upload.preview = 'Error reading file';
                        upload.html = '<p>Error reading file</p>';
                        upload.url = '#';
                        saveUpload(tab, upload);
                    });
            }
        };
        reader.readAsArrayBuffer(file);
        fileInput.value = '';
    }
}

function handleReviewSubmit(event) {
    const formData = new FormData(event.target);
    const review = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9), // unique ID
        title: formData.get('book-title'),
        author: formData.get('author'),
        series: formData.get('series'),
        genre: formData.get('genre'),
        dateFinished: formData.get('date-finished'),
        rating: parseInt(formData.get('rating')),
        date: new Date().toISOString()
    };

    const fileInput = event.target.querySelector('input[type="file"]');
    const file = fileInput.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const arrayBuffer = e.target.result;
            review.fileName = file.name;
            review.type = file.type.startsWith('image/') ? 'image' : 'docx';
            if (review.type === 'image') {
                review.preview = e.target.result;
                review.fileUrl = e.target.result;
            } else {
                mammoth.convertToHtml({arrayBuffer: arrayBuffer})
                    .then(function(result) {
                        const html = result.value;
                        const tempDiv = document.createElement('div');
                        tempDiv.innerHTML = html;
                        const text = tempDiv.textContent || tempDiv.innerText || '';
                        const lines = text.split('\n').filter(line => line.trim());
                        review.preview = lines.slice(0, 2).join('\n');
                        review.fileUrl = 'data:text/plain;charset=utf-8,' + encodeURIComponent(text);
                        saveUpload('reviews', review);
                    })
                    .catch(function(err) {
                        console.error('Error converting DOCX:', err);
                        review.preview = 'Error reading file';
                        review.fileUrl = '#';
                        saveUpload('reviews', review);
                    });
            }
            if (review.type === 'image') {
                saveUpload('reviews', review);
            }
        };
        reader.readAsArrayBuffer(file);
    } else {
        saveUpload('reviews', review);
    }

    event.target.reset();
}

// Save upload to localStorage
function saveUpload(tab, upload) {
    const key = tab + 'Uploads';
    const uploads = JSON.parse(localStorage.getItem(key) || '[]');
    uploads.push(upload);
    localStorage.setItem(key, JSON.stringify(uploads));
    if (tab === 'writing') {
        displayWritingUploads(uploads);
    } else {
        displayUploads(tab, uploads);
    }
}

function openEditModal(tab, upload) {
    const modal = document.createElement('div');
    modal.className = 'edit-modal';
    
    const modalContent = document.createElement('div');
    modalContent.className = 'edit-modal-content';
    
    // Create form fields
    if (tab === 'reviews' || tab.startsWith('reviews')) {
        modalContent.innerHTML = `
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
            <div class="edit-modal-buttons">
                <button id="save-edit-btn" class="save-btn">Save Changes</button>
                <button id="cancel-edit-btn" class="cancel-btn">Cancel</button>
            </div>
        `;
    }
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Populate values AFTER modal is in DOM to ensure elements exist
    if (tab === 'reviews' || tab.startsWith('reviews')) {
        document.getElementById('edit-title').value = upload.title || '';
        document.getElementById('edit-author').value = upload.author || '';
        document.getElementById('edit-series').value = upload.series || '';
        document.getElementById('edit-genre').value = upload.genre || '';
        document.getElementById('edit-rating').value = upload.rating || 3;
        document.getElementById('edit-date-finished').value = upload.dateFinished || '';
    } else {
        document.getElementById('edit-title').value = upload.title || '';
        document.getElementById('edit-category').value = upload.category || 'stories';
        const textArea = document.getElementById('edit-fulltext');
        if (textArea) {
            textArea.value = upload.fullText || upload.preview || '';
        }
    }
    
    document.getElementById('save-edit-btn').addEventListener('click', () => {
        saveEditUpload(tab, upload, modal);
    });
    
    document.getElementById('cancel-edit-btn').addEventListener('click', () => {
        modal.remove();
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

function saveEditUpload(tab, upload, modal) {
    let key = 'writingUploads';
    let mainTab = 'writing';
    if (tab === 'reviews' || tab.startsWith('reviews')) {
        key = 'reviewsUploads';
        mainTab = 'reviews';
    }
    
    const uploads = JSON.parse(localStorage.getItem(key) || '[]');
    const uploadIndex = uploads.findIndex(item => item.id === upload.id);
    
    if (uploadIndex !== -1) {
        if (mainTab === 'reviews') {
            uploads[uploadIndex].title = document.getElementById('edit-title').value;
            uploads[uploadIndex].author = document.getElementById('edit-author').value;
            uploads[uploadIndex].series = document.getElementById('edit-series').value;
            uploads[uploadIndex].genre = document.getElementById('edit-genre').value;
            uploads[uploadIndex].rating = parseInt(document.getElementById('edit-rating').value);
            uploads[uploadIndex].dateFinished = document.getElementById('edit-date-finished').value;
        } else {
            uploads[uploadIndex].title = document.getElementById('edit-title').value;
            uploads[uploadIndex].category = document.getElementById('edit-category').value;
            
            // Update text content if editing writing files
            const textArea = document.getElementById('edit-fulltext');
            if (textArea) {
                const newText = textArea.value;
                uploads[uploadIndex].fullText = newText;
                
                // Convert edited text back to HTML with proper paragraph formatting
                const paragraphs = newText.split('\n\n').filter(p => p.trim());
                const htmlContent = paragraphs.map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('\n');
                uploads[uploadIndex].html = htmlContent;
                
                // Update preview (first 2 paragraphs)
                uploads[uploadIndex].preview = paragraphs.slice(0, 2).join('\n\n');
                
                // Update download URL to HTML to preserve formatting
                uploads[uploadIndex].url = 'data:text/html;charset=utf-8,' + encodeURIComponent(htmlContent);
            }
        }
        
        localStorage.setItem(key, JSON.stringify(uploads));
        
        if (mainTab === 'writing') {
            displayWritingUploads(uploads);
        } else {
            displayUploads(mainTab, uploads);
        }
        
        modal.remove();
        alert('Changes saved!');
    }
}

function deleteUpload(tab, upload) {
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    // Determine the correct key based on tab
    let key = 'writingUploads';
    let mainTab = 'writing';
    if (tab === 'reviews' || tab.startsWith('reviews')) {
        key = 'reviewsUploads';
        mainTab = 'reviews';
    }
    
    const uploads = JSON.parse(localStorage.getItem(key) || '[]');
    
    // Find the upload by matching id (unique identifier)
    const indexToDelete = uploads.findIndex(item => item.id === upload.id);
    if (indexToDelete !== -1) {
        uploads.splice(indexToDelete, 1);
        localStorage.setItem(key, JSON.stringify(uploads));
        
        if (mainTab === 'writing') {
            displayWritingUploads(uploads);
        } else {
            displayUploads(mainTab, uploads);
        }
    }
}
function deleteComment(uploadIndex, commentId, parentId) {
    if (!confirm('Are you sure you want to delete this comment?')) return;
    
    const uploads = JSON.parse(localStorage.getItem('writingUploads') || '[]');
    const upload = uploads[uploadIndex];
    
    if (!upload || !upload.comments) return;
    
    function removeComment(comments) {
        for (let i = 0; i < comments.length; i++) {
            if (comments[i].id === commentId) {
                comments.splice(i, 1);
                return true;
            }
            if (comments[i].replies && removeComment(comments[i].replies)) {
                return true;
            }
        }
        return false;
    }
    
    removeComment(upload.comments);
    localStorage.setItem('writingUploads', JSON.stringify(uploads));
    displayWritingUploads(uploads);
}

// Event listeners
document.getElementById('writing-form').addEventListener('submit', (e) => handleUpload(e, 'writing'));
document.getElementById('reviews-form').addEventListener('submit', (e) => handleUpload(e, 'reviews'));

function toggleAdminMode() {
    const isAdmin = localStorage.getItem('isAdmin') === 'true';
    if (!isAdmin) {
        const password = prompt('Enter admin password:');
        if (password === 'ChickenSalt15') { // Simple password, change as needed
            localStorage.setItem('isAdmin', 'true');
            showAdminForms();
        } else {
            alert('Incorrect password');
        }
    } else {
        localStorage.removeItem('isAdmin');
        hideAdminForms();
    }
}

function checkAdminMode() {
    const isAdmin = localStorage.getItem('isAdmin') === 'true';
    if (isAdmin) {
        showAdminForms();
    }
}

function showAdminForms() {
    document.querySelectorAll('.upload-form').forEach(form => {
        form.style.display = 'block';
    });
    document.querySelectorAll('.review-form').forEach(form => {
        form.style.display = 'grid';
    });
    document.querySelectorAll('.song-form').forEach(form => {
        form.style.display = 'block';
    });
    document.getElementById('admin-toggle').textContent = 'Exit Admin Mode';
    loadUploads(); // Reload to show delete buttons
}

function hideAdminForms() {
    document.querySelectorAll('.upload-form, .review-form').forEach(form => {
        form.style.display = 'none';
    });
    document.querySelectorAll('.song-form').forEach(form => {
        form.style.display = 'none';
    });
    document.getElementById('admin-toggle').textContent = 'Admin Mode';
    loadUploads(); // Reload to hide delete buttons
}

// Load on page load
window.addEventListener('load', function() {
    loadUploads();
    checkAdminMode();
    initializePromptGenerator();
    initializeSongOfTheDay();
});

// ============ SONG OF THE DAY ============

function initializeSongOfTheDay() {
    const songForm = document.getElementById('song-form');
    if (songForm) {
        songForm.addEventListener('submit', handleSongEmbed);
    }
    loadSongOfTheDay();
}

function handleSongEmbed(e) {
    e.preventDefault();
    const input = document.getElementById('song-embed');
    const value = input.value.trim();
    if (!value) return;

    let trackId = value;
    // Extract track ID from URL if full URL provided
    const match = value.match(/track\/([a-zA-Z0-9]+)/);
    if (match) {
        trackId = match[1];
    }

    const songData = {
        trackId: trackId,
        date: new Date().toISOString()
    };

    localStorage.setItem('songOfTheDay', JSON.stringify(songData));
    displaySongOfTheDay(songData);

    // Reset form
    input.value = '';
}

function loadSongOfTheDay() {
    const songData = localStorage.getItem('songOfTheDay');
    if (songData) {
        displaySongOfTheDay(JSON.parse(songData));
    } else {
        const display = document.getElementById('song-display');
        if (display) {
            display.innerHTML = '<p>No song embedded yet.</p>';
        }
    }
}

function displaySongOfTheDay(songData) {
    const display = document.getElementById('song-display');
    if (!display) return;

    // Create Spotify embed
    const embedUrl = `https://open.spotify.com/embed/track/${songData.trackId}`;

    display.innerHTML = `
        <iframe src="${embedUrl}" width="100%" height="352" frameborder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>
    `;

    // Reload Spotify embed if the script is available
    if (window.Spotify && window.Spotify.Embed) {
        window.Spotify.Embed.reload();
    }
}

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

function buildPrompts(seeds, appenders, count) {
  const result = [];
  let seedIndex = 0;
  let appendIndex = 0;

  while (result.length < count) {
    result.push(`${seeds[seedIndex]} ${appenders[appendIndex]}`);
    seedIndex = (seedIndex + 1) % seeds.length;
    appendIndex = (appendIndex + 1) % appenders.length;
  }

  return result;
}

const promptSets = {
  character: buildPrompts(characterSeeds, characterModifiers, 200),
  location: buildPrompts(locationSeeds, locationModifiers, 200),
  motive: buildPrompts(motiveSeeds, motiveModifiers, 200),
  complication: buildPrompts(complicationSeeds, complicationModifiers, 200)
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