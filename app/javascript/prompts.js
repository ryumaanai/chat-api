document.addEventListener('DOMContentLoaded', () => {
  let chatContainer = document.getElementById('chat-container');
  let promptsList = document.getElementById('prompts-list');
  let threadTitle = document.getElementById('thread-title');
  let showThreadsBtn = document.getElementById('show-threads-btn');
  const threadsModal = document.getElementById('threads-modal');
  const closeThreadsBtn = document.getElementById('close-threads-btn');
  const threadsList = document.getElementById('threads-list');
  let newThreadBtn = document.getElementById('new-thread-btn');
  let form = document.getElementById('generation-form');
  let threadControls = document.getElementById('thread-controls');

  renderMarkdown();
  scrollToBottom();

  if (form) {
    form.addEventListener('submit', handleFormSubmit);
    const textarea = form.querySelector('textarea');
    textarea.addEventListener('input', () => autoResizeTextarea(textarea));
    textarea.addEventListener('keydown', handleTextareaKeydown);
  }

  if (showThreadsBtn) {
    showThreadsBtn.addEventListener('click', () => {
      fetchChatThreads();
      threadsModal.style.display = 'flex';
    });
  }

  if (closeThreadsBtn) {
    closeThreadsBtn.addEventListener('click', () => {
      threadsModal.style.display = 'none';
    });
  }

  if (threadsList) {
    threadsList.addEventListener('click', handleThreadSelection);
  }

  if (newThreadBtn) {
    newThreadBtn.addEventListener('click', createNewThread);
  }

  window.addEventListener('click', (event) => {
    if (event.target === threadsModal) {
      threadsModal.style.display = 'none';
    }
  });

  function handleTextareaKeydown(e) {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
      e.preventDefault();
      if (isValidInput(e.target.value)) {
        form.dispatchEvent(new Event('submit'));
      }
    }
  }

  function isValidInput(input) {
    return /\S/.test(input);
  }

  function handleFormSubmit(event) {
    event.preventDefault();
    const textarea = form.querySelector('textarea');
    if (!isValidInput(textarea.value)) {
      return;
    }
    const formData = new FormData(form);
    const promptContent = textarea.value;
    const targetElement = appendPromptElement(promptContent);
    form.reset();
    resetTextareaSize(textarea);
    sendPromptToAPI(formData, targetElement);
  }

  function appendPromptElement(promptContent) {
    const promptElement = document.createElement('div');
    promptElement.innerHTML = `
      <div class="prompt-box">
        <p class="prompt">You:</p>
        <p class="prompt-text">${formatText(promptContent)}</p>
      </div>
      <div class="response-box">
        <p class="response">GPT:</p>
        <p class="response-text"><span id="response-text-${Date.now()}"></span></p>
      </div>
    `;
    promptsList.appendChild(promptElement);
    scrollToBottom();
    return promptElement.querySelector('.response-text span');
  }

  function sendPromptToAPI(formData, promptElement) {
    fetch(form.action, {
      method: 'POST',
      body: formData,
      headers: {
        'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').content,
        'Accept': 'application/json'
      }
    })
    .then(response => response.json())
    .then(data => {
      displayResponse(data.text, promptElement);
      if (data.thread_title) {
        updateThreadTitleDisplay(data.thread_title);
      }
    })
    .catch(error => handleAPIError(error, promptElement));
  }

  function updateThreadTitleDisplay(title) {
    if (threadTitle) {
      threadTitle.textContent = title;
    } else {
      const newTitleElement = document.createElement('h1');
      newTitleElement.id = 'thread-title';
      newTitleElement.textContent = title;
      document.body.insertBefore(newTitleElement, document.body.firstChild);
    }
  }

  function displayResponse(text, container) {
    container.setAttribute('data-markdown', text);
    const htmlContent = marked.parse(text);
    let currentIndex = 0;
    
    const intervalId = setInterval(() => {
      if (currentIndex < htmlContent.length) {
        container.innerHTML = htmlContent.substring(0, currentIndex + 1);
        currentIndex++;
        scrollToBottom();
      } else {
        clearInterval(intervalId);
        container.querySelectorAll('pre code').forEach((block) => {
          hljs.highlightBlock(block);
        });
        scrollToBottom();
      }
    }, 5);
  }

  function scrollToBottom() {
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }

  function handleAPIError(error, container) {
    console.error('APIリクエストが失敗しました', error);
    container.innerText = 'エラーが発生しました。';
  }

  function formatText(text) {
    const escapeHtml = (unsafe) => {
      return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    };
    return escapeHtml(text).replace(/\n/g, '<br>');
  }

  function fetchChatThreads() {
    fetch('/chat_threads', {
      headers: {
        'Accept': 'application/json'
      }
    })
      .then(response => response.json())
      .then(data => {
        threadsList.innerHTML = '';
        data.chat_threads.forEach(chatThread => {
          const threadItem = document.createElement('div');
          threadItem.classList.add('thread-item');
          threadItem.dataset.chatThreadId = chatThread.id;
          threadItem.textContent = chatThread.title;
          threadsList.appendChild(threadItem);
        });
      })
      .catch(error => console.error('スレッド一覧の取得に失敗しました', error));
  }

  function handleThreadSelection(event) {
    if (event.target.classList.contains('thread-item')) {
      const chatThreadId = event.target.dataset.chatThreadId;
      fetchAndDisplayThread(chatThreadId);
    }
  }

  function fetchAndDisplayThread(chatThreadId) {
    fetch(`/chat_threads/${chatThreadId}`, {
      headers: {
        'Accept': 'application/json'
      }
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      console.log('Received data:', data);
      if (data.chat_thread) {
        history.pushState(null, '', `/chat_threads/${chatThreadId}`);
        hideThreadsModal();
        updateChatInterface(data.chat_thread, data.prompts);
      } else {
        throw new Error('Chat thread data is missing');
      }
    })
    .catch(error => {
      console.error('スレッドの取得に失敗しました', error);
      alert('スレッドの読み込みに失敗しました。もう一度お試しください。');
    });
  }
  
  function updateChatInterface(chatThread, prompts) {
    console.log('Received chat thread:', chatThread);
    console.log('Received prompts:', prompts);

    const centerContainer = document.querySelector('.center-container');
    if (centerContainer) {
      centerContainer.remove();
    }

    if (!threadControls.querySelector('#new-thread-btn')) {
      const newThreadBtn = document.createElement('button');
      newThreadBtn.id = 'new-thread-btn';
      newThreadBtn.className = 'thread-control-btn';
      newThreadBtn.textContent = '+';
      newThreadBtn.addEventListener('click', createNewThread);
      threadControls.insertBefore(newThreadBtn, threadControls.firstChild);
    }

    // 新しいHTMLの挿入
    const newHtml = `
      <pre style="display: none;">${chatThread.context || ''}</pre>
      <h1 id="thread-title">${chatThread.title || 'Untitled Thread'}</h1>
      <div id="thread-controls">
        <button id="new-thread-btn" class="thread-control-btn">+</button>
        <button id="show-threads-btn" class="thread-control-btn">❏</button>
      </div> 
      <div id="chat-container">
        <div id="prompts-list"></div>
      </div>
      <form id="generation-form" action="/chat_threads/${chatThread.id}/prompts" data-remote="true">
        <div class="textarea-with-submit-inside">
          <textarea name="prompt[content]" class="rounded-corners"></textarea>
          <input type="submit" value="↑" class="submit-within-textarea rounded-corners">
        </div>
      </form>
    `;

    document.body.insertAdjacentHTML('afterbegin', newHtml);

    chatContainer = document.getElementById('chat-container');
    promptsList = document.getElementById('prompts-list');
    threadTitle = document.getElementById('thread-title');
    showThreadsBtn = document.getElementById('show-threads-btn');
    newThreadBtn = document.getElementById('new-thread-btn');
    form = document.getElementById('generation-form');

    if (prompts && Array.isArray(prompts)) {
      prompts.forEach(prompt => {
        if (prompt.content) {
          appendPrompt(prompt.content, prompt.response);
        }
      });
    }

    initializeForm(form);
    if (showThreadsBtn) {
      showThreadsBtn.addEventListener('click', () => {
        fetchChatThreads();
        threadsModal.style.display = 'flex';
      });
    }
    if (newThreadBtn) {
      newThreadBtn.addEventListener('click', createNewThread);
    }

    renderMarkdown();
    scrollToBottom();
  }

  function initializeForm(formElement) {
    formElement.addEventListener('submit', handleFormSubmit);
    const textarea = formElement.querySelector('textarea');
    textarea.addEventListener('input', () => autoResizeTextarea(textarea));
    textarea.addEventListener('keydown', handleTextareaKeydown);
  }

  function appendPrompt(content, response) {
    const promptElement = document.createElement('div');
    promptElement.innerHTML = `
      <div class="prompt-box">
        <p class="prompt">You:</p>
        <p class="prompt-text">${formatText(content)}</p>
      </div>
      <div class="response-box">
        <p class="response">GPT:</p>
        <p class="response-text" data-markdown>${response}</p>
      </div>
    `;
    promptsList.appendChild(promptElement);
  }

  function createNewThread() {
    fetch('/chat_threads', {
      method: 'POST',
      headers: {
        'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').content,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    })
    .then(response => response.json())
    .then(data => {
      if (data.chat_thread) {
        updateChatInterface(data.chat_thread, []);
        history.pushState(null, '', `/chat_threads/${data.chat_thread.id}`);
      } else {
        console.error('新規スレッドの作成に失敗しました', data.errors);
      }
    })
    .catch(error => console.error('新規スレッドの作成に失敗しました', error));
  }

  function autoResizeTextarea(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  }

  function resetTextareaSize(textarea) {
    textarea.style.height = 'auto';
  }

  function renderMarkdown() {
    document.querySelectorAll('.response-text[data-markdown]').forEach(elem => {
      elem.innerHTML = marked.parse(elem.textContent);
    });
  }

  function hideThreadsModal() {
    threadsModal.style.display = 'none';
  }
});
