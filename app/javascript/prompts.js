// document.addEventListener('DOMContentLoaded', () => {
//   document.querySelectorAll('.response-text[data-markdown]').forEach(elem => {
//     elem.innerHTML = marked.parse(elem.textContent);
//   });
  
//   const form = document.getElementById('generation-form');
//   const promptsList = document.getElementById('prompts-list');
//   const showThreadsBtn = document.getElementById('show-threads-btn');
//   const threadsModal = document.getElementById('threads-modal');
//   const closeThreadsBtn = document.getElementById('close-threads-btn');
//   const threadsList = document.getElementById('threads-list');
//   const newThreadBtn = document.getElementById('new-thread-btn');
  
//   if (form) {
//     scrollToBottom();
//     const textarea = form.querySelector('textarea');

//     form.addEventListener('submit', handleFormSubmit);
//     textarea.addEventListener('input', () => autoResizeTextarea(textarea));

//     textarea.addEventListener('keydown', (e) => {
//       if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
//         e.preventDefault();
//         if (isValidInput(textarea.value)) {
//           form.dispatchEvent(new Event('submit'));
//         }
//       }
//     });
//   }

//   if (showThreadsBtn) {
//     showThreadsBtn.addEventListener('click', () => {
//       fetchChatThreads();
//       threadsModal.style.display = 'flex';
//     });
//   }

//   if (closeThreadsBtn) {
//     closeThreadsBtn.addEventListener('click', () => {
//       threadsModal.style.display = 'none';
//     });
//   }

//   if (threadsList) {
//     threadsList.addEventListener('click', handleThreadSelection);
//   }

//   if (newThreadBtn) {
//     newThreadBtn.addEventListener('click', createNewThread);
//   }

//   window.addEventListener('click', (event) => {
//     if (event.target === threadsModal) {
//       threadsModal.style.display = 'none';
//     }
//   });

//   function isValidInput(input) {
//     return /\S/.test(input);
//   }

//   function handleFormSubmit(event) {
//     event.preventDefault();
//     const textarea = form.querySelector('textarea');
//     if (!isValidInput(textarea.value)) {
//       return;
//     }
//     const formData = new FormData(form);
//     const promptContent = form.querySelector('textarea').value;
//     const targetElement = appendPromptElement(promptContent);
//     form.reset();
//     resetTextareaSize(form.querySelector('textarea'));
//     sendPromptToAPI(formData, targetElement);
//   }

//   function appendPromptElement(promptContent) {
//     const promptElement = document.createElement('div');
//     promptElement.innerHTML = `
//       <div class="prompt-box">
//         <p class="prompt">You:</p>
//         <p class="prompt-text">${formatText(promptContent)}</p>
//       </div>
//       <div class="response-box">
//         <p class="response">GPT:</p>
//         <p class="response-text"><span id="response-text-${Date.now()}"></span></p>
//       </div>
//     `;
//     promptsList.appendChild(promptElement);
//     scrollToBottom();
//     return promptElement.querySelector('.response-text span');
//   }

//   function sendPromptToAPI(formData, promptElement) {
//     const responseTextContainer = promptElement;
//     fetch(form.action, {
//       method: 'POST',
//       body: formData,
//       headers: {
//         'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').content
//       }
//     })
//     .then(response => response.json())
//     .then(data => {
//       displayResponse(data.text, responseTextContainer);
//       if (data.thread_title) {
//         updateThreadTitleDisplay(data.thread_title);
//       }
//     })
//     .catch(error => handleAPIError(error, responseTextContainer));
//   }

//   function updateThreadTitleDisplay(title) {
//     const titleElement = document.getElementById('thread-title');
//     if (titleElement) {
//       titleElement.textContent = title;
//     } else {
//       const newTitleElement = document.createElement('h1');
//       newTitleElement.id = 'thread-title';
//       newTitleElement.textContent = title;
//       document.body.insertBefore(newTitleElement, document.body.firstChild);
//     }
//   }

//   function displayResponse(text, container) {
//     container.setAttribute('data-markdown', text);
//     const htmlContent = marked.parse(text);
//     let currentIndex = 0;
    
//     const intervalId = setInterval(() => {
//       if (currentIndex < htmlContent.length) {
//         container.innerHTML = htmlContent.substring(0, currentIndex + 1);
//         currentIndex++;
//         scrollToBottom();
//       } else {
//         clearInterval(intervalId);
//         container.querySelectorAll('pre code').forEach((block) => {
//           hljs.highlightBlock(block);
//         });
//         scrollToBottom();
//       }
//     }, 5);
//   }

//   function scrollToBottom() {
//     const chatContainer = document.getElementById('chat-container');
//     chatContainer.scrollTop = chatContainer.scrollHeight;
//   }

//   function handleAPIError(error, container) {
//     console.error('APIリクエストが失敗しました', error);
//     container.innerText = 'エラーが発生しました。';
//   }

//   function formatText(text) {
//     const escapeHtml = (unsafe) => {
//       return unsafe
//         .replace(/&/g, "&amp;")
//         .replace(/</g, "&lt;")
//         .replace(/>/g, "&gt;")
//         .replace(/"/g, "&quot;")
//         .replace(/'/g, "&#039;");
//     };
//     return escapeHtml(text).replace(/\n/g, '<br>');
//   }

//   function fetchChatThreads() {
//     fetch('/chat_threads')
//       .then(response => response.json())
//       .then(data => {
//         threadsList.innerHTML = '';
//         data.chat_threads.forEach(chatThread => {
//           const threadItem = document.createElement('div');
//           threadItem.classList.add('thread-item');
//           threadItem.dataset.chatThreadId = chatThread.id;
//           threadItem.textContent = `${chatThread.title}`;
//           threadsList.appendChild(threadItem);
//         });
//       })
//       .catch(error => console.error('スレッド一覧の取得に失敗しました', error));
//   }

//   function handleThreadSelection(event) {
//     if (event.target.classList.contains('thread-item')) {
//       const chatThreadId = event.target.dataset.chatThreadId;
//       window.location.href = `/prompts?chat_thread_id=${chatThreadId}`;
//     }
//   }

//   function createNewThread() {
//     fetch('/chat_threads', {
//       method: 'POST',
//       headers: {
//         'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').content,
//         'Content-Type': 'application/json'
//       }
//     })
//     .then(response => response.json())
//     .then(data => {
//       if (data.chat_thread) {
//         window.location.href = `/prompts?chat_thread_id=${data.chat_thread.id}`;
//       } else {
//         console.error('新規スレッドの作成に失敗しました', data.errors);
//       }
//     })
//     .catch(error => console.error('新規スレッドの作成に失敗しました', error));
//   }

//   function autoResizeTextarea(textarea) {
//     textarea.style.height = 'auto';
//     textarea.style.height = `${textarea.scrollHeight}px`;
//   }

//   function resetTextareaSize(textarea) {
//     textarea.style.height = 'auto';
//   }
// });
